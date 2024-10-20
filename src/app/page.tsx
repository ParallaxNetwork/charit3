import Image from "next/image"
import { GetStartedButton } from "@/components/get-started-button"

export default function Home() {
  return (
    <div className="container pt-6 pb-24 px-4 h-svh bg-splash">
      <main className="flex flex-col items-center text-center">
        <Image
          className=""
          src="/logo-1.svg"
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
        <p className="text-black font-bold text-[46px] mt-12 leading-tight">
          Stake Once, <br /> Donate Forever.
        </p>

        <GetStartedButton />
      </main>
    </div>
  )
}
