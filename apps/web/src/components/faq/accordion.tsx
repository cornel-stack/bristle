"use client";

import { useState, type KeyboardEvent } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { FAQ_ITEMS } from "./faq-data";

export function FaqAccordion() {
  const [value, setValue] = useState<string>("faq-q-1");

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape" && value) {
      e.preventDefault();
      setValue("");
    }
  }

  return (
    <Accordion.Root
      type="single"
      collapsible
      value={value}
      onValueChange={setValue}
      onKeyDown={handleKeyDown}
      className="divide-y divide-border-default border-y border-border-default"
    >
      {FAQ_ITEMS.map((item) => (
        <Accordion.Item
          key={item.id}
          value={item.id}
          id={item.id}
          data-section={item.section}
          data-faq-item=""
        >
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-grid py-card text-left text-body-md font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle">
              <span className="font-sans">{item.question}</span>
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 stroke-[1.5] text-text-secondary transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden">
            <p className="pb-card pr-loose font-serif text-body-md text-text-secondary">
              {item.answer}
            </p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
