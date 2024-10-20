import { getServerSession, type DefaultSession, type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { type SIWESession, verifySignature, getChainIdFromMessage, getAddressFromMessage } from "@reown/appkit-siwe"
import { projectId } from "@/lib/wagmi"
import { dbConnect } from "./mongoose"
import User from "./models/user"
import type { Session } from "next-auth"

import { env } from "@/env"

declare module "next-auth" {
  interface Session extends SIWESession {
    user: {
      id: string
      address: string
      name: string
      role: "user" | "admin"
    } & DefaultSession["user"]
  }
}

const useSecureCookies = env.NEXTAUTH_URL?.startsWith("https://")

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Ethereum",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      authorize: async (credentials) => {
        try {
          if (!credentials?.message) {
            throw new Error("SiweMessage is undefined")
          }
          const { message, signature } = credentials
          const address = getAddressFromMessage(message)
          const chainId = getChainIdFromMessage(message)

          const isValid = await verifySignature({ address, message, signature, chainId, projectId })

          if (!isValid) {
            return null
          }

          await dbConnect()

          let user = await User.findOne({ address })

          if (!user) {
            user = await User.create({
              address,
              role: "user",
            })
          }

          return {
            id: user._id.toString(),
            address: user.address,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error("Authorize", error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // When working on localhost, the cookie domain must be omitted entirely (https://stackoverflow.com/a/1188145)
        domain: useSecureCookies ? `.${env.NEXT_PUBLIC_ROOT_DOMAIN}` : undefined,
        secure: useSecureCookies,
      },
    },
  },
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (trigger === "update" && session) {
        token = session
      }
      if (user) {
        token.user = user
      }
      return token
    },
    session: ({ session, token }) => {
      const res = {
        ...session,
        user: token.user as Session["user"],
      }

      return res
    },
  },
}

export const getServerAuthSession = () => getServerSession(authOptions)
