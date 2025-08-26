"use client";

import { useToast } from "@/hooks/use-toast";
import { Assistant } from "@langchain/langgraph-sdk";
import { ContextDocument } from "@opencanvas/shared/types";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";

type AssistantContentType = {
  assistants: Assistant[];
  selectedAssistant: Assistant | undefined;
  isLoadingAllAssistants: boolean;
  isDeletingAssistant: boolean;
  isCreatingAssistant: boolean;
  isEditingAssistant: boolean;
  getOrCreateAssistant: () => Promise<void>;
  deleteAssistant: (assistantId: string) => Promise<boolean>;
  createCustomAssistant: (
    args: CreateCustomAssistantArgs
  ) => Promise<Assistant | undefined>;
  editCustomAssistant: (
    args: EditCustomAssistantArgs
  ) => Promise<Assistant | undefined>;
  setSelectedAssistant: Dispatch<SetStateAction<Assistant | undefined>>;
};

export type AssistantTool = {
  /**
   * The name of the tool
   */
  name: string;
  /**
   * The tool's description.
   */
  description: string;
  /**
   * JSON Schema for the parameters of the tool.
   */
  parameters: Record<string, any>;
};

export interface CreateAssistantFields {
  iconData?: {
    /**
     * The name of the Lucide icon to use for the assistant.
     * @default "User"
     */
    iconName: string;
    /**
     * The hex color code to use for the icon.
     */
    iconColor: string;
  };
  /**
   * The name of the assistant.
   */
  name: string;
  /**
   * An optional description of the assistant, provided by the user/
   */
  description?: string;
  /**
   * The tools the assistant has access to.
   */
  tools?: Array<AssistantTool>;
  /**
   * An optional system prompt to prefix all generations with.
   */
  systemPrompt?: string;
  is_default?: boolean;
  /**
   * The documents to include in the LLMs context.
   */
  documents?: ContextDocument[];
}

export type CreateCustomAssistantArgs = {
  newAssistant: CreateAssistantFields;
  successCallback?: (id: string) => void;
};

export type EditCustomAssistantArgs = {
  editedAssistant: CreateAssistantFields;
  assistantId: string;
};

const AssistantContext = createContext<AssistantContentType | undefined>(
  undefined
);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isLoadingAllAssistants, setIsLoadingAllAssistants] = useState(false);
  const [isDeletingAssistant, setIsDeletingAssistant] = useState(false);
  const [isCreatingAssistant, setIsCreatingAssistant] = useState(false);
  const [isEditingAssistant, setIsEditingAssistant] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant>();

  const deleteAssistant = async (assistantId: string): Promise<boolean> => {
    setIsDeletingAssistant(true);
    try {
      const assistants =
        JSON.parse(localStorage.getItem("assistants") || "[]") || [];
      const updatedAssistants = assistants.filter(
        (assistant: Assistant) => assistant.assistant_id !== assistantId
      );
      localStorage.setItem("assistants", JSON.stringify(updatedAssistants));

      if (selectedAssistant?.assistant_id === assistantId) {
        // Get the first assistant in the list to set as
        const defaultAssistant =
          assistants.find((a) => a.metadata?.is_default) || assistants[0];
        setSelectedAssistant(defaultAssistant);
      }

      setAssistants((prev) =>
        prev.filter((assistant) => assistant.assistant_id !== assistantId)
      );
      setIsDeletingAssistant(false);
      return true;
    } catch (e) {
      toast({
        title: "Failed to delete assistant",
        description: "Please try again later.",
      });
      console.error("Failed to delete assistant", e);
      setIsDeletingAssistant(false);
      return false;
    }
  };

  const createCustomAssistant = async ({
    newAssistant,
    successCallback,
  }: CreateCustomAssistantArgs): Promise<Assistant | undefined> => {
    setIsCreatingAssistant(true);
    try {
      const { tools, systemPrompt, name, documents, ...metadata } =
        newAssistant;
      const createdAssistant = {
        assistant_id: `asst_${Math.random().toString(36).substring(7)}`,
        name,
        metadata: {
          user_id: "anonymous",
          ...metadata,
        },
        config: {
          configurable: {
            tools,
            systemPrompt,
            documents,
          },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Assistant;

      const assistants =
        JSON.parse(localStorage.getItem("assistants") || "[]") || [];
      assistants.push(createdAssistant);
      localStorage.setItem("assistants", JSON.stringify(assistants));

      setAssistants((prev) => [...prev, createdAssistant]);
      setSelectedAssistant(createdAssistant);
      successCallback?.(createdAssistant.assistant_id);
      setIsCreatingAssistant(false);
      return createdAssistant;
    } catch (e) {
      toast({
        title: "Failed to create assistant",
        description: "Please try again later.",
      });
      setIsCreatingAssistant(false);
      console.error("Failed to create an assistant", e);
      return undefined;
    }
  };

  const editCustomAssistant = async ({
    editedAssistant,
    assistantId,
  }: EditCustomAssistantArgs): Promise<Assistant | undefined> => {
    setIsEditingAssistant(true);
    try {
      const { tools, systemPrompt, name, documents, ...metadata } =
        editedAssistant;
      const updatedAssistant = {
        assistant_id: assistantId,
        name,
        metadata: {
          user_id: "anonymous",
          ...metadata,
        },
        config: {
          configurable: {
            tools,
            systemPrompt,
            documents,
          },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Assistant;

      const assistants =
        JSON.parse(localStorage.getItem("assistants") || "[]") || [];
      const updatedAssistants = assistants.map((assistant: Assistant) => {
        if (assistant.assistant_id === assistantId) {
          return updatedAssistant;
        }
        return assistant;
      });
      localStorage.setItem("assistants", JSON.stringify(updatedAssistants));

      setAssistants((prev) =>
        prev.map((assistant) => {
          if (assistant.assistant_id === assistantId) {
            return updatedAssistant;
          }
          return assistant;
        })
      );
      setIsEditingAssistant(false);
      return updatedAssistant;
    } catch (e) {
      console.error("Failed to edit assistant", e);
      setIsEditingAssistant(false);
      return undefined;
    }
  };

  const getOrCreateAssistant = async () => {
    if (selectedAssistant) {
      return;
    }
    setIsLoadingAllAssistants(true);
    const assistants =
      JSON.parse(localStorage.getItem("assistants") || "[]") || [];

    if (!assistants.length) {
      // No assistants found, create a new assistant and set it as the default.
      await createCustomAssistant({
        newAssistant: {
          iconData: {
            iconName: "User",
            iconColor: "#000000",
          },
          name: "Default assistant",
          description: "Your default assistant.",
          is_default: true,
        },
      });

      // Return early because this function will set the selected assistant and assistants state.
      setIsLoadingAllAssistants(false);
      return;
    }

    setAssistants(assistants);

    const defaultAssistant = assistants.find(
      (assistant: Assistant) => assistant.metadata?.is_default
    );
    if (!defaultAssistant) {
      // Update the first assistant to be the default assistant, then set it as the selected assistant.
      const firstAssistant = assistants.sort((a: Assistant, b: Assistant) => {
        return a.created_at.localeCompare(b.created_at);
      })[0];
      const updatedAssistant = await editCustomAssistant({
        editedAssistant: {
          is_default: true,
          iconData: {
            iconName:
              (firstAssistant.metadata?.iconName as string | undefined) ||
              "User",
            iconColor:
              (firstAssistant.metadata?.iconColor as string | undefined) ||
              "#000000",
          },
          description:
            (firstAssistant.metadata?.description as string | undefined) ||
            "Your default assistant.",
          name:
            firstAssistant.name?.toLowerCase() === "Untitled"
              ? "Default assistant"
              : firstAssistant.name,
          tools:
            (firstAssistant.config?.configurable?.tools as
              | AssistantTool[]
              | undefined) || undefined,
          systemPrompt:
            (firstAssistant.config?.configurable?.systemPrompt as
              | string
              | undefined) || undefined,
        },
        assistantId: firstAssistant.assistant_id,
      });

      setSelectedAssistant(updatedAssistant);
    } else {
      setSelectedAssistant(defaultAssistant);
    }

    setIsLoadingAllAssistants(false);
  };

  const contextValue: AssistantContentType = {
    assistants,
    selectedAssistant,
    isLoadingAllAssistants,
    isDeletingAssistant,
    isCreatingAssistant,
    isEditingAssistant,
    getOrCreateAssistant,
    deleteAssistant,
    createCustomAssistant,
    editCustomAssistant,
    setSelectedAssistant,
  };

  return (
    <AssistantContext.Provider value={contextValue}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistantContext() {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error(
      "useAssistantContext must be used within a AssistantProvider"
    );
  }
  return context;
}
