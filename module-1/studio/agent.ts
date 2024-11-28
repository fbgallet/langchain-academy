import { MessagesAnnotation, StateGraph, START } from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { z } from "zod";

// Tools
const add = tool(
  (input) => {
    return input.a + input.b;
  },
  {
    name: "add_tool",
    description: "Add two numbers a and b",
    schema: z.object({
      a: z.number().describe("number a"),
      b: z.number().describe("number b"),
    }),
  }
);

const multiply = tool(
  (input) => {
    return input.a * input.b;
  },
  {
    name: "multiply_tool",
    description: "Multiply two numbers a and b",
    schema: z.object({
      a: z.number().describe("number a"),
      b: z.number().describe("number b"),
    }),
  }
);

const divide = tool(
  (input) => {
    return input.a / input.b;
  },
  {
    name: "divide_tool",
    description: "Divide two numbers a and b",
    schema: z.object({
      a: z.number().describe("number a"),
      b: z.number().describe("number b"),
    }),
  }
);

const tools = [add, multiply, divide];

// LLM with bound tool
const llm = new ChatOpenAI({ model: "gpt-4o" });
const llm_with_tools = llm.bindTools(tools);

// System message
const sys_msg = new SystemMessage({
  content:
    "You are a helpful assistant tasked with writing performing arithmetic on a set of inputs, using a set of tools available.",
});

// Node
const assistant = async (state: typeof MessagesAnnotation.State) => {
  return {
    messages: [
      await llm_with_tools.invoke([sys_msg].concat(state["messages"])),
    ],
  };
};

// Build graph
const builder = new StateGraph(MessagesAnnotation);
builder
  .addNode("assistant", assistant)
  .addNode("tools", new ToolNode(tools))
  .addEdge(START, "assistant")
  .addConditionalEdges(
    "assistant",
    // If the latest message (result) from assistant is a tool call -> tools_condition routes to tools
    // If the latest message (result) from assistant is a not a tool call -> tools_condition routes to END
    toolsCondition
  )
  .addEdge("tools", "assistant");

// Compile graph
export const graph = builder.compile();
