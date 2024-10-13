import CreateIssueForm from "@/components/form/create-issue";
import React from "react";
type Props = {};

const CreateIssue = (props: Props) => {
  return (
    <div className="container">
      <CreateIssueForm />
    </div>
  );
};

export default CreateIssue;
