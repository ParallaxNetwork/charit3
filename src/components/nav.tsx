import Image from "next/image";
import React from "react";
import { Button } from "./ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";

type Props = {};

const Nav = (props: Props) => {
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

        <Button size="sm">Create Issue</Button>
        {/* <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">Create Issue</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog> */}
      </div>
    </>
  );
};

export default Nav;
