import VoteForm from "@/components/form/vote";
import Nav from "@/components/nav";
import React from "react";

type Props = {};

const VotePage = (props: Props) => {
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
