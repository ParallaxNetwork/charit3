import { redirect } from "next/navigation";
import React from "react";

const VerifyPage = () => {
  redirect("/home"); // temp
  return <div className="container pt-6 pb-24 px-4">VerifyPage</div>;
};

export default VerifyPage;
