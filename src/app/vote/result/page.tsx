import NavBack from "@/components/nav-back";
import React from "react";
import VoteResultContent from "./content";

const VotingResult = () => {
  return (
    <div className="container bg-splash-dimmed h-screen overflow-hidden relative">
      <NavBack title="Voting Result" />
      <VoteResultContent />
    </div>
  );
};

export default VotingResult;
