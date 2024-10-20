import { redirect } from "next/navigation"
import { getServerAuthSession } from "@/server/auth"
import { env } from "@/env"

const MINIMUM_SCORE = 2

export default async function VerifyPage() {
  const session = await getServerAuthSession()
  const passport = await fetch(
    "https://api.scorer.gitcoin.co/registry/submit-passport",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": env.GITCOIN_PASSPORT_API_KEY,
      },
      body: JSON.stringify({
        address: session?.user.address,
        scorer_id: env.GITCOIN_PASSPORT_SCORER_ID,
      }),
    },
  ).then((res) => res.json())

  if (passport?.score >= MINIMUM_SCORE) {
    return redirect("/home")
  }

  return (
    <div className="container flex h-svh items-center px-4 py-6">
      <div>
        <h1 className="text-center text-3xl font-semibold">Verify Humanity</h1>
        <p className="mt-4 text-center font-bold">
          Your score: {Number(passport?.score).toFixed(2)}
        </p>
        <p className="mt-4 text-center">
          You need a minimum of <b>{MINIMUM_SCORE}</b> Proof of Humanity score
          to access Charit3.
        </p>
        <p className="mt-2 text-center">
          Visit{" "}
          <a
            href="https://passport.gitcoin.co/"
            className="text-blue underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gitcoin Passport
          </a>{" "}
          to increase your score and then refresh this page.
        </p>
      </div>
    </div>
  )
}
