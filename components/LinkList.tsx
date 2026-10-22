import * as React from "react";
import { FC } from "react";
import { cn } from "./utils";

export type LinkListProps = {
  className?: string;
  links: string[];
};

export const LinkList: FC<LinkListProps> = ({ className, links }) => {
  return (
    <ol
      className={cn(
        "flex list-outside list-decimal flex-col gap-y-1 pl-[2em]",
        className,
      )}
    >
      {links.map((link, index) => (
        <li key={index} className="break-all max-w-prose">
          <a className="text-link underline body-text max-w-prose" href={link}>
            {link}
          </a>
        </li>
      ))}
    </ol>
  );
};
