import type { MetaFunction } from "@remix-run/node";
import { Authenticator } from "@aws-amplify/ui-react";
import { useState } from "react";
import { useDuckDb } from "../aws/api";
import AppBar from "../components/appbar";
import { albAccessLogQueryTemplate } from "../lib/queries";

export const meta: MetaFunction = () => {
  return [
    { title: "CloudDuck" },
    { name: "description", content: "Welcome to CloudDuck!" },
  ];
};

export default function Index() {
  const [sql, setSql] = useState<string>("");
  const [editorString, setEditorString] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const { data: dbData, isLoading } = useDuckDb(sql);

  const handleSubmitQuery = async () => {
    setSql(editorString);
  };

  const handleSetTemplate = (template: string) => {
    setEditorString(template);
    setIsMenuOpen(false);
  };

  return (
    <Authenticator hideSignUp>
      <div className="flex flex-col h-screen">
        <AppBar />
        <div className="flex flex-grow justify-center bg-gradient-to-r from-purple-500 to-indigo-500 text-gray-100 pt-4 pb-4">
          <div className="flex flex-col items-center gap-4 p-6 bg-gray-800 shadow-2xl rounded-lg w-full max-w-4xl">
            <div className="flex justify-between w-full">
              <div></div>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-300"
                >
                  Select SQL Template
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10">
                    <button
                      onClick={() => handleSetTemplate(albAccessLogQueryTemplate)}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      Analyze ALB Access Log
                    </button>
                  </div>
                )}
              </div>
            </div>
            <textarea
              value={editorString}
              onChange={(e) => setEditorString(e.target.value)}
              placeholder="Enter your SQL query here"
              className="w-full h-64 p-4 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSubmitQuery}
              disabled={isLoading}
              className={`px-6 py-3 ${isLoading ? 'bg-gray-500' : 'bg-green-500'} text-white rounded-lg ${isLoading ? '' : 'hover:bg-green-600'} transition duration-300 flex items-center justify-center`}
            >
              {isLoading && <div className="animate-spin h-5 w-5 border-4 border-blue-500 rounded-full border-t-transparent mr-2" />}
              Submit Query
            </button>
            <pre className="w-full h-64 p-4 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg overflow-auto">
              {dbData ? JSON.stringify(dbData, null, 2) : ""}
            </pre>
          </div>
        </div>
      </div>
    </Authenticator>
  );
}
