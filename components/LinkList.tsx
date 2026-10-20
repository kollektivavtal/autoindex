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
        "flex list-inside list-decimal flex-col gap-y-1 text-xs",
        className,
      )}
    >
      {links.map((link, index) => (
        <li key={index} className="truncate text-ellipsis">
          <a className=" text-link underline font-lilex" href={link}>
            {link}
          </a>
        </li>
      ))}
    </ol>
  );
};
