import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";

export default function Home() {
  return (
    <div className="container pt-6 pb-24 px-4 min-h-screen bg-splash">
      <main className="flex flex-col items-center text-center">
        <Image
          className=""
          src="/logo.svg"
          alt="logo"
          width={184}
          height={52}
          priority
        />
        <Image
          className="mt-6 rounded-[40px] w-full"
          src="/home-image.png"
          alt="home-image"
          width={398}
          height={462}
          priority
        />
        <p className="text-black font-bold text-[46px] mt-12 ">
          Stake Once, <br /> Donate Forever.
        </p>

        <Link href="/verify">
          <Button variant="default" size="lg" className="mt-12 rounded-full">
            Get Started
            <FaArrowRight className="ml-2" />
          </Button>
        </Link>
      </main>
    </div>
  );
}
