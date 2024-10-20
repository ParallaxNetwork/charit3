import VoteForm from "@/components/vote";
import Nav from "@/components/nav";
import React from "react";
import VoteTutorial from "./tutorial";

const VotePage = () => {
  return (
    <div className="container">
      <Nav />
      <div className="min-h-screen">
        <VoteForm />
      </div>
      <VoteTutorial />
    </div>
  );
};

export default VotePage;
