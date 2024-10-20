import { redirect } from "next/navigation"
import { getServerAuthSession } from "@/server/auth"

export default async function VerifyPage() {
  const session = await getServerAuthSession()
  const passport = await fetch(
    "https://api.scorer.gitcoin.co/registry/submit-passport",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": "lWkfjrDP.ch7dekOp009z8E4Q5shyIfcfEnUP9OuD",
      },
      body: JSON.stringify({
        address: session?.user.address,
        scorer_id: "8148",
      }),
    },
  ).then((res) => res.json())

  if (passport?.score > 2) {
    return redirect("/home")
  }

  return (
    <div className="container px-4 pb-24 pt-6">
      <h1 className="text-center text-3xl font-semibold">Verify Humanity</h1>
      <p className="mt-4 text-center">
        Your score: {Number(passport?.score).toFixed(2)}
      </p>
      <p className="mt-4 text-center">
        You need a minimum of 20 Proof of Humanity score to access Charit3.
        Please go to{" "}
        <a
          href="https://passport.gitcoin.co/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Gitcoin Passport
        </a>
        and verify your identity to increase your score.
      </p>
    </div>
  )
}
