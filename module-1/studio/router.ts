import {
  MessagesAnnotation,
  StateGraph,
  START,
  END,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { z } from "zod";

// Tool
const multiply = tool(
  (input) => {
    return input.a * input.b;
  },
  {
    name: "multiply",
    description: "Multiply two numbers a and b",
    schema: z.object({
      a: z.number().describe("number a"),
      b: z.number().describe("number b"),
    }),
  }
);

// LLM with bound tool
const llm = new ChatOpenAI({ model: "gpt-4o" });
const llm_with_tools = llm.bindTools([multiply]);

// Node
const tool_calling_llm = async (state: typeof MessagesAnnotation.State) => {
  return { messages: [await llm_with_tools.invoke(state["messages"])] };
};

// Build graph
const builder = new StateGraph(MessagesAnnotation);
builder
  .addNode("tool_calling_llm", tool_calling_llm)
  .addNode("tools", new ToolNode([multiply]))
  .addEdge(START, "tool_calling_llm")
  .addConditionalEdges(
    "tool_calling_llm",
    // If the latest message (result) from assistant is a tool call -> tools_condition routes to tools
    // If the latest message (result) from assistant is a not a tool call -> tools_condition routes to END
    toolsCondition
  )
  .addEdge("tools", END);

// Compile graph
export const graph = builder.compile();
