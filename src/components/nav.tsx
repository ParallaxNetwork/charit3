"use client";

import Image from "next/image";
import React from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

type Props = {};

const Nav = (props: Props) => {
  const router = useRouter();
  return (
    <>
      <div className="flex items-center justify-between gap-3 px-[18px] py-5 border-b border-dark/5 backdrop-blur-[50px]">
        <Image
          className="w-36"
          src="/logo.svg"
          alt="logo"
          width={184}
          height={52}
          priority
        />

        <Button
          size="sm"
          onClick={() => {
            const query = new URLSearchParams();
            query.set("from", "/home");
            router.push("/create-issue" + "?" + query.toString());
          }}
        >
          Create Issue
        </Button>
      </div>
    </>
  );
};

export default Nav;
