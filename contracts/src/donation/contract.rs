use soroban_sdk::{contract, contractimpl, token, Address, Bytes, BytesN, Env, Vec};

use crate::donation::{
    events::emit_stealth_donation,
    storage::{
        add_project_donation, get_project_donations, get_stealth_counter, get_stealth_donation,
        set_stealth_counter, set_stealth_donation,
    },
    types::StealthDonation,
};

#[contract]
pub struct DonationContract;

#[contractimpl]
impl DonationContract {
    /// Derives a deterministic stealth-address identifier from a project
    /// wallet and an ephemeral public key.  Uses SHA-256 over the
    /// concatenation of the project wallet's XDR representation and the
    /// ephemeral key bytes.
    pub fn generate_stealth_address(
        env: Env,
        project_wallet: Address,
        ephemeral_pubkey: BytesN<33>,
    ) -> BytesN<32> {
        use soroban_sdk::xdr::ToXdr;

        let wallet_xdr = project_wallet.to_xdr(&env);
        let ephem_bytes: Bytes = ephemeral_pubkey.into();

        let mut data = Bytes::new(&env);
        data.append(&wallet_xdr);
        data.append(&ephem_bytes);

        let hash = env.crypto().sha256(&data);
        hash.to_bytes()
    }

    /// Records a donation sent from a stealth address.
    pub fn donate_stealth(
        env: Env,
        sender: Address,
        token: Address,
        ephemeral_pubkey: BytesN<33>,
        project_wallet: Address,
        amount: i128,
        msg_hash: BytesN<32>,
    ) -> u64 {
        sender.require_auth();

        let stealth_addr = Self::generate_stealth_address(
            env.clone(),
            project_wallet.clone(),
            ephemeral_pubkey.clone(),
        );

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &amount);

        let donation_id = get_stealth_counter(&env) + 1;
        set_stealth_counter(&env, donation_id);

        let donation = StealthDonation {
            stealth_address: stealth_addr,
            project_wallet: project_wallet.clone(),
            ephemeral_pubkey: ephemeral_pubkey.clone(),
            amount,
            msg_hash: msg_hash.clone(),
        };
        set_stealth_donation(&env, donation_id, &donation);

        add_project_donation(&env, &project_wallet, donation_id);

        emit_stealth_donation(
            &env,
            donation_id,
            &project_wallet,
            amount,
            &ephemeral_pubkey,
            &msg_hash,
        );

        donation_id
    }

    /// Returns every stealth donation belonging to `project_wallet`.
    pub fn scan_stealth_donations(
        env: Env,
        project_wallet: Address,
        viewing_key: BytesN<32>,
    ) -> Vec<StealthDonation> {
        project_wallet.require_auth();

        let _ = viewing_key;

        let donation_ids = get_project_donations(&env, &project_wallet);
        let mut donations = Vec::new(&env);
        for i in 0..donation_ids.len() {
            let id = donation_ids.get(i).unwrap();
            let donation = get_stealth_donation(&env, id);
            donations.push_back(donation);
        }
        donations
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use soroban_sdk::{
        vec,
        testutils::{Address as _, MockAuth, MockAuthInvoke},
        BytesN, Env, IntoVal,
    };

    #[contract]
    struct TestHarness;

    #[contractimpl]
    impl TestHarness {
        pub fn generate_stealth_address(
            env: Env,
            project_wallet: Address,
            ephemeral_pubkey: BytesN<33>,
        ) -> BytesN<32> {
            DonationContract::generate_stealth_address(env, project_wallet, ephemeral_pubkey)
        }

        pub fn donate_stealth(
            env: Env,
            sender: Address,
            token: Address,
            ephemeral_pubkey: BytesN<33>,
            project_wallet: Address,
            amount: i128,
            msg_hash: BytesN<32>,
        ) -> u64 {
            DonationContract::donate_stealth(
                env,
                sender,
                token,
                ephemeral_pubkey,
                project_wallet,
                amount,
                msg_hash,
            )
        }

        pub fn scan_stealth_donations(
            env: Env,
            project_wallet: Address,
            viewing_key: BytesN<32>,
        ) -> Vec<StealthDonation> {
            DonationContract::scan_stealth_donations(env, project_wallet, viewing_key)
        }

        pub fn get_stealth_donation(env: Env, donation_id: u64) -> StealthDonation {
            crate::donation::storage::get_stealth_donation(&env, donation_id)
        }
    }

    // ── generate_stealth_address ───────────────────────────────────────────

    #[test]
    fn test_generate_stealth_address_deterministic() {
        let env = Env::default();
        let contract_id = env.register(TestHarness, ());
        let client = TestHarnessClient::new(&env, &contract_id);

        let project = Address::generate(&env);
        let ephem = BytesN::from_array(&env, &[1u8; 33]);

        let addr1 = client.generate_stealth_address(&project, &ephem);
        let addr2 = client.generate_stealth_address(&project, &ephem);

        assert_eq!(addr1, addr2);
    }

    #[test]
    fn test_generate_stealth_address_different_keys() {
        let env = Env::default();
        let contract_id = env.register(TestHarness, ());
        let client = TestHarnessClient::new(&env, &contract_id);

        let project = Address::generate(&env);
        let ephem1 = BytesN::from_array(&env, &[1u8; 33]);
        let ephem2 = BytesN::from_array(&env, &[2u8; 33]);

        let addr1 = client.generate_stealth_address(&project, &ephem1);
        let addr2 = client.generate_stealth_address(&project, &ephem2);

        assert_ne!(addr1, addr2);
    }

    // ── donate_stealth ─────────────────────────────────────────────────────

    #[allow(deprecated)]
    #[test]
    fn test_donate_stealth() {
        let env = Env::default();
        let contract_id = env.register(TestHarness, ());
        let client = TestHarnessClient::new(&env, &contract_id);

        let token_admin = Address::generate(&env);
        let token_address = env.register_stellar_asset_contract(token_admin.clone());
        let token_sac = token::StellarAssetClient::new(&env, &token_address);

        let donor = Address::generate(&env);
        let project = Address::generate(&env);
        let ephem = BytesN::from_array(&env, &[42u8; 33]);
        let msg_hash = BytesN::from_array(&env, &[0u8; 32]);
        let amount: i128 = 5_000_000;

        // Authorise token mint
        env.mock_auths(&[MockAuth {
            address: &token_admin,
            invoke: &MockAuthInvoke {
                contract: &token_address,
                fn_name: "mint",
                args: vec![
                    &env,
                    donor.clone().into_val(&env),
                    amount.into_val(&env),
                ],
                sub_invokes: &[],
            },
        }]);
        token_sac.mint(&donor, &amount);

        // Authorise donor for donate_stealth + nested token.transfer
        let transfer_args = vec![
            &env,
            donor.clone().into_val(&env),
            contract_id.clone().into_val(&env),
            amount.into_val(&env),
        ];
        let transfer_sub = MockAuthInvoke {
            contract: &token_address,
            fn_name: "transfer",
            args: transfer_args,
            sub_invokes: &[],
        };

        let args = vec![
            &env,
            donor.clone().into_val(&env),
            token_address.clone().into_val(&env),
            ephem.clone().into_val(&env),
            project.clone().into_val(&env),
            amount.into_val(&env),
            msg_hash.clone().into_val(&env),
        ];
        env.mock_auths(&[MockAuth {
            address: &donor,
            invoke: &MockAuthInvoke {
                contract: &contract_id,
                fn_name: "donate_stealth",
                args,
                sub_invokes: &[transfer_sub],
            },
        }]);

        let donation_id = client.donate_stealth(
            &donor,
            &token_address,
            &ephem,
            &project,
            &amount,
            &msg_hash,
        );

        assert_eq!(donation_id, 1u64);

        let stored = client.get_stealth_donation(&1);

        assert_eq!(stored.amount, amount);
        assert_eq!(stored.project_wallet, project);
        assert_eq!(stored.ephemeral_pubkey, ephem);
        assert_eq!(stored.msg_hash, msg_hash);
    }

    // ── scan_stealth_donations ─────────────────────────────────────────────

    #[allow(deprecated)]
    fn seed_donations(env: &Env, contract_id: &Address) -> (Address, BytesN<32>) {
        let client = TestHarnessClient::new(env, contract_id);

        let token_admin = Address::generate(env);
        let token_address = env.register_stellar_asset_contract(token_admin.clone());
        let token_sac = token::StellarAssetClient::new(env, &token_address);
        let project = Address::generate(env);
        let viewing_key = BytesN::from_array(env, &[99u8; 32]);

        let donor1 = Address::generate(env);
        let donor2 = Address::generate(env);
        let ephem1 = BytesN::from_array(env, &[10u8; 33]);
        let ephem2 = BytesN::from_array(env, &[20u8; 33]);
        let msg_hash = BytesN::from_array(env, &[0u8; 32]);

        let mint_args1 = vec![env, donor1.clone().into_val(env), 10_000_000i128.into_val(env)];
        env.mock_auths(&[MockAuth {
            address: &token_admin,
            invoke: &MockAuthInvoke {
                contract: &token_address,
                fn_name: "mint",
                args: mint_args1,
                sub_invokes: &[],
            },
        }]);
        token_sac.mint(&donor1, &10_000_000);
        let mint_args2 = vec![env, donor2.clone().into_val(env), 10_000_000i128.into_val(env)];
        env.mock_auths(&[MockAuth {
            address: &token_admin,
            invoke: &MockAuthInvoke {
                contract: &token_address,
                fn_name: "mint",
                args: mint_args2,
                sub_invokes: &[],
            },
        }]);
        token_sac.mint(&donor2, &10_000_000);

        let donor1_transfer = MockAuthInvoke {
            contract: &token_address,
            fn_name: "transfer",
            args: vec![
                env,
                donor1.clone().into_val(env),
                contract_id.clone().into_val(env),
                3_000_000i128.into_val(env),
            ],
            sub_invokes: &[],
        };
        let auth1_args = vec![
            env,
            donor1.clone().into_val(env),
            token_address.clone().into_val(env),
            ephem1.clone().into_val(env),
            project.clone().into_val(env),
            3_000_000i128.into_val(env),
            msg_hash.clone().into_val(env),
        ];
        env.mock_auths(&[MockAuth {
            address: &donor1,
            invoke: &MockAuthInvoke {
                contract: contract_id,
                fn_name: "donate_stealth",
                args: auth1_args,
                sub_invokes: &[donor1_transfer],
            },
        }]);
        client.donate_stealth(&donor1, &token_address, &ephem1, &project, &3_000_000, &msg_hash);

        let donor2_transfer = MockAuthInvoke {
            contract: &token_address,
            fn_name: "transfer",
            args: vec![
                env,
                donor2.clone().into_val(env),
                contract_id.clone().into_val(env),
                7_000_000i128.into_val(env),
            ],
            sub_invokes: &[],
        };
        let auth2_args = vec![
            env,
            donor2.clone().into_val(env),
            token_address.clone().into_val(env),
            ephem2.clone().into_val(env),
            project.clone().into_val(env),
            7_000_000i128.into_val(env),
            msg_hash.clone().into_val(env),
        ];
        env.mock_auths(&[MockAuth {
            address: &donor2,
            invoke: &MockAuthInvoke {
                contract: contract_id,
                fn_name: "donate_stealth",
                args: auth2_args,
                sub_invokes: &[donor2_transfer],
            },
        }]);
        client.donate_stealth(&donor2, &token_address, &ephem2, &project, &7_000_000, &msg_hash);

        (project, viewing_key)
    }

    #[test]
    fn test_scan_stealth_donations() {
        let env = Env::default();
        let contract_id = env.register(TestHarness, ());
        let (project, viewing_key) = seed_donations(&env, &contract_id);

        let client = TestHarnessClient::new(&env, &contract_id);

        let args = vec![
            &env,
            project.clone().into_val(&env),
            viewing_key.clone().into_val(&env),
        ];

        env.mock_auths(&[MockAuth {
            address: &project,
            invoke: &MockAuthInvoke {
                contract: &contract_id,
                fn_name: "scan_stealth_donations",
                args,
                sub_invokes: &[],
            },
        }]);

        let donations = client.scan_stealth_donations(&project, &viewing_key);

        assert_eq!(donations.len(), 2);
        assert_eq!(donations.get(0).unwrap().amount, 3_000_000);
        assert_eq!(donations.get(1).unwrap().amount, 7_000_000);
    }

    #[test]
    fn test_scan_stealth_donations_empty() {
        let env = Env::default();
        let contract_id = env.register(TestHarness, ());
        let client = TestHarnessClient::new(&env, &contract_id);

        let project = Address::generate(&env);
        let viewing_key = BytesN::from_array(&env, &[0u8; 32]);

        let args = vec![
            &env,
            project.clone().into_val(&env),
            viewing_key.clone().into_val(&env),
        ];

        env.mock_auths(&[MockAuth {
            address: &project,
            invoke: &MockAuthInvoke {
                contract: &contract_id,
                fn_name: "scan_stealth_donations",
                args,
                sub_invokes: &[],
            },
        }]);

        let donations = client.scan_stealth_donations(&project, &viewing_key);

        assert_eq!(donations.len(), 0);
    }

    // ── Unlinkability ──────────────────────────────────────────────────────

    #[test]
    fn test_stealth_address_unlinkability() {
        let env = Env::default();
        let contract_id = env.register(TestHarness, ());
        let client = TestHarnessClient::new(&env, &contract_id);

        let project = Address::generate(&env);

        let ephem_alice = BytesN::from_array(&env, &[100u8; 33]);
        let ephem_bob = BytesN::from_array(&env, &[200u8; 33]);

        let alice_stealth = client.generate_stealth_address(&project, &ephem_alice);
        let bob_stealth = client.generate_stealth_address(&project, &ephem_bob);

        assert_ne!(alice_stealth, bob_stealth);
    }
}
