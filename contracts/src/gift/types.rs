use soroban_sdk::contracttype;

/// Storage keys for the gift contract's instance storage.
#[contracttype]
pub enum DataKey {
    /// The privileged admin address, set once at initialization.
    Admin,
}
