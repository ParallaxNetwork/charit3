import Nav from "@/components/nav";
import Image from "next/image";
import { LuPencil } from "react-icons/lu";
import { LuWallet } from "react-icons/lu";
import { LuDollarSign } from "react-icons/lu";
import { LuTrophy } from "react-icons/lu";
import { LuPiggyBank } from "react-icons/lu";
import { BiDonateHeart } from "react-icons/bi";

import StakeForm from "@/components/form/stake";

type Props = {};

const HomePage = (props: Props) => {
  // fetch staked amount
  // if staked amount is 0, show the stake form

  return (
    <div className="container bg-splash-dimmed">
      <Nav />
      <div className="py-6 px-4 flex flex-col items-center">
        <Image
          src="/pfp.jpeg"
          alt="pfp"
          width={52}
          height={52}
          priority
          className="w-[72px] h-[72px] rounded-full border border-[#DBDBDB] object-cover object-center"
        />
        <div className="flex items-center gap-2 mt-2">
          <p className="mt-2 text-dark font-bold">Aldi Arif K</p>
          <LuPencil className="text-dark/40 mt-2" />
        </div>
        <div className="mt-5 flex items-center gap-9">
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-full border border-dark/20 flex items-center justify-center">
              <LuWallet className="text-dark text-3xl" />
            </div>
            <p className="mt-2 text-dark text-sm">Wallet</p>
          </div>
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-full border border-dark/20 flex items-center justify-center">
              <LuDollarSign className="text-dark text-3xl" />
            </div>
            <p className="mt-2 text-dark text-sm">Stake</p>
          </div>
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-full border border-dark/20 flex items-center justify-center">
              <LuTrophy className="text-dark text-3xl" />
            </div>
            <p className="mt-2 text-dark text-sm">Rank</p>
          </div>
        </div>
        <div className="w-full grid grid-cols-2 gap-3 mt-6">
          <div className="bg-white border border-dark/20 rounded-2xl text-center flex flex-col items-center gap-4 p-6">
            <LuPiggyBank className="text-xl" />
            <p className="text-xl text-dark font-bold">$0.00</p>
            <div className="badge">Stake Amout</div>
          </div>
          <div className="bg-white border border-dark/20 rounded-2xl text-center flex flex-col items-center gap-4 p-6">
            <BiDonateHeart className="text-xl" />
            <p className="text-xl text-dark font-bold">$450.00</p>
            <div className="badge">Donation Amount</div>
          </div>
        </div>
        <div className="mt-6 w-full">
          <p className="text-base font-medium text-dark">Last Round’s Result</p>

          <div className="relative overflow-hidden">
            <div className="mt-3 grid gap-2 max-h-72 overflow-y-scroll ">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div
                  key={i}
                  className="bg-white flex items-start justify-between p-4 border border-dark/20 rounded-xl"
                >
                  <div>
                    <p className="font-bold text-sm text-dark">
                      Title topic or headline is here
                    </p>
                    <div className="flex items-center gap-2">
                      <BiDonateHeart className="text-sm" />
                      <p className="font-bold text-sm text-dark">
                        Total donation :{" "}
                        <span className="text-green font-semibold">
                          $1,220.00
                        </span>
                      </p>
                    </div>
                  </div>
                  <p className="font-black text-base text-dark">#{i + 1}</p>
                </div>
              ))}
            </div>
            {[1, 2, 3, 4, 5].length > 3 && (
              <div className="absolute bg-blur h-44 left-0 right-0 -bottom-20 pointer-events-none"></div>
            )}
          </div>
        </div>

        <StakeForm />
      </div>
    </div>
  );
};

export default HomePage;
