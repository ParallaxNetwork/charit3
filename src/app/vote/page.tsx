import VoteForm from "@/components/form/vote";
import Nav from "@/components/nav";
import React from "react";

const VotePage = () => {
  return (
    <div className="container">
      <Nav />
      <div className="min-h-screen">
        <VoteForm />
      </div>
    </div>
  );
};

export default VotePage;
