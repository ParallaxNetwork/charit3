import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DateTime } from "luxon"
import mime from "mime"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDollar = (amount: number) => {
  return `$${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`
}

export const countDownTo = (time: number) => {
  // 14 : 20 : 11
  const now = DateTime.now()
  const target = DateTime.fromSeconds(time)
  const diff = target.diff(now, ["hours", "minutes", "seconds"])
  return diff.toFormat("hh : mm : ss")
}

export function checkFileExtension(file: File, types: string[]): boolean {
  const fileType = mime.getType(file.name)
  if (!fileType) {
    return false
  }
  const fileExtension = mime.getExtension(fileType)!
  return types.includes(fileExtension)
}

export function fileToBase64(file?: File): Promise<string> {
  if (!file) {
    return Promise.resolve("")
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const shortAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Helper function to create a bitmap from an array of issueIds (uint256)
export const createBitmap = (issueIds: number[]) => {
  let bitmap = BigInt(0) // Start with a uint256 (BigInt)
  issueIds.forEach((issueId) => {
    bitmap |= BigInt(1) << BigInt(issueId - 1) // Set the bit for the given issueId
  })
  return bitmap
}

// Function to create a bitmap for votes (with votes being between 1 and B)
export const createPledgeBitmap = (issueIds: number[], votes: number[]) => {
  if (issueIds.length !== votes.length) {
    throw new Error("Issue IDs and votes length mismatch.")
  }

  let bitmap = BigInt(0) // Initialize bitmap as BigInt to represent the full uint256 bitmap

  issueIds.forEach((issueId, index) => {
    const voteValue = votes[index] ?? 0

    // Ensure the vote/pledge value is valid (between 1 and B, hexadecimal 0x1 to 0xB)
    if (voteValue < 1 || voteValue > 11) {
      throw new Error(
        `Vote value for issue ${issueId} is out of range (1 to B).`,
      )
    }

    // Shift and OR the vote value in the correct position (use 4 bits for each vote)
    bitmap |= BigInt(voteValue) << BigInt((issueId - 1) * 4) // Shift by 4 bits per issue
  })

  return bitmap // Return the bitmap representing the votes/pledges
}

export const setVoteLocalStorage = (issueId: string, vote: number) => {
  const votes = JSON.parse(localStorage.getItem("votes") ?? "{}")
  votes[issueId] = vote
  localStorage.setItem("votes", JSON.stringify(votes))
}

export const getVoteLocalStorage = (issueId: string) => {
  const votes = JSON.parse(localStorage.getItem("votes") ?? "{}")
  return votes[issueId]
}

export const clearVoteLocalStorage = () => {
  localStorage.removeItem("votes")
}

export const getVotedIssueIdsLocalStorage = () => {
  const votes = JSON.parse(localStorage.getItem("votes") ?? "{}")
  return Object.keys(votes).map((issueId) => issueId)
}

export const setVoteRoundLocalStorage = (round: number) => {
  localStorage.setItem("round", round.toString())
}

export const getVoteRoundLocalStorage = () => {
  return Number(localStorage.getItem("round"))
}

export const clearVoteRoundLocalStorage = () => {
  localStorage.removeItem("round")
}

export const retrieveVoteYesFromLocalStorage = () => {
  const votes = JSON.parse(localStorage.getItem("votes") ?? "{}")
  const voteYesIssuesId = Object.keys(votes)
    .filter((issueId) => Number(votes[issueId]) >= 1)
    .map((issueId) => Number(issueId))
  const voteYesPower = voteYesIssuesId.map((issueId) => Number(votes[issueId]))
  return [voteYesIssuesId || [], voteYesPower || []]
}

export const retrieveVoteNoFromLocalStorage = () => {
  const votes = JSON.parse(localStorage.getItem("votes") ?? "{}")
  const voteNoIssuesId = Object.keys(votes)
    .filter((issueId) => Number(votes[issueId]) < 1)
    .map((issueId) => Number(issueId))
  return voteNoIssuesId
}
