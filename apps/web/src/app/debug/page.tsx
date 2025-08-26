"use client";

import { useAssistantContext } from "@/contexts/AssistantContext";
import { useEffect } from "react";

export default function DebugPage() {
  const {
    assistants,
    selectedAssistant,
    isLoadingAllAssistants,
    getOrCreateAssistant,
  } = useAssistantContext();

  useEffect(() => {
    getOrCreateAssistant();
  }, [getOrCreateAssistant]);

  return (
    <div>
      <h1>Debug Page</h1>
      <p>
        This page is for debugging the application in an environment without
        authentication.
      </p>
      <h2>Assistants</h2>
      {isLoadingAllAssistants ? (
        <p>Loading assistants...</p>
      ) : (
        <ul>
          {assistants.map((assistant) => (
            <li key={assistant.assistant_id}>
              {assistant.name}
              {selectedAssistant?.assistant_id === assistant.assistant_id
                ? " (selected)"
                : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
