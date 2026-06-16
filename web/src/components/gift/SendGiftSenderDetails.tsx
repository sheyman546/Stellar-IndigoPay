import ImageUpload from "../ImageUpload";
import { Input } from "../Input";

const SendGiftSenderDetails = () => {
  return (
    <section className="bg-[#F7F7FC] min-h-dvh md:mx-5">
      <div className="bg-white w-full md:w-fit mx-auto p-4 md:p-8 flex flex-col gap-[16px] rounded-4xl">
        <div className="font-br-firma flex flex-col gap-0.5">
          <h4 className="text-[#18181B] font-br-firma font-medium text-2xl leading-8 tracking-[0%]">
            Sender detail
          </h4>
          <p className="text-[#18181B] font-br-firma text-sm leading-5">
            Please provide your details as a sender
          </p>
        </div>
        <div className="w-full md:w-[376px] space-y-2">
          <h5 className="font-medium font-br-firma text-base mb-2 text-[#18181B]">
            Upload your image (Optional)
          </h5>
          <div className="h-72 rounded-xl overflow-hidden">
            <ImageUpload className="h-full" />
          </div>
        </div>
        <div className="flex flex-col gap-4 relative">
          <div className="relative">
            <Input
              placeholder="Your full name"
              type="text"
              className="font-br-firma font-normal text-sm leading-[100%] text-[#1F2937]
            placeholder:text-[#9CA3AF] placeholder:bg-transparent placeholder:p-1 
            placeholder:w-fit placeholder:font-br-firma placeholder:font-normal 
            placeholder:text-sm placeholder:leading-[100%] 
            placeholder:text-center rounded-xl  transition-all duration-150 ease-in-out"
            />
          </div>
          <div className="relative">
            <Input
              placeholder="Email address"
              type="email"
              className="font-br-firma font-normal text-sm leading-[100%] text-[#1F2937]
            placeholder:text-[#9CA3AF] placeholder:bg-transparent placeholder:p-1 
            placeholder:w-fit placeholder:font-br-firma placeholder:font-normal 
            placeholder:text-sm placeholder:leading-[100%] 
            placeholder:text-center rounded-xl  transition-all duration-150 ease-in-out"
            />
          </div>
          <div className="relative">
            <Input
              placeholder="Confirm email address"
              type="email"
              className="font-br-firma font-normal text-sm leading-[100%] text-[#1F2937]
            placeholder:text-[#9CA3AF] placeholder:bg-transparent placeholder:p-1 
            placeholder:w-fit placeholder:font-br-firma placeholder:font-normal 
            placeholder:text-sm placeholder:leading-[100%] 
            placeholder:text-center rounded-xl  transition-all duration-150 ease-in-out"
            />
          </div>
        </div>
        <div>
          <button className="bg-[#5A42DE] hover:bg-[#6b60ac] w-full rounded-md py-2 px-3 font-br-firma text-white font-medium text-base leading-6 trackin-[16px] cursor-pointer transition-all duration-150 ease-in-out">
            Gift $200
          </button>
        </div>
      </div>
    </section>
  );
};

export default SendGiftSenderDetails;
