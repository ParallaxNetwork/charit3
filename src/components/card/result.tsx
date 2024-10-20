"use client";

import { formatDollar } from "@/lib/utils";
import { BiDonateHeart } from "react-icons/bi";

interface ICardResult {
  title: string;
  amount: number;
  index: number;
  image?: string;
}

const CardResult = ({ title, amount, index, image }: ICardResult) => {
  return (
    <>
      <div className="bg-white flex items-start justify-between p-4 border border-dark/20 rounded-xl">
        <div className="flex items-center gap-5">
          <img
            src={image}
            alt={title}
            className="w-[72px] h-[72px] rounded-full object-cover object-center"
          />
          <div>
            <p className="font-bold text-sm text-dark">{title}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <BiDonateHeart className="text-sm shrink-0" />
              <p className="font-normal text-sm text-dark">
                Total donation :{" "}
                <span className="text-green font-semibold">
                  {formatDollar(amount)}
                </span>
              </p>
            </div>
          </div>
        </div>
        <p className="font-black text-base text-dark">#{index + 1}</p>
      </div>
    </>
  );
};

export default CardResult;
