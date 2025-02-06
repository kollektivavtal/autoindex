import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@arbetsmarknad/components/Breadcrumb";
import {
  DocumentList,
  DocumentItem,
  DocumentIcon,
  DocumentLink,
  DocumentDescription,
} from "@arbetsmarknad/components/DocumentList";
import { Container } from "@arbetsmarknad/components/Container";
import { HeaderMenu } from "@arbetsmarknad/components/HeaderMenu";
import { LinkList } from "@arbetsmarknad/components/LinkList";
import { Footer } from "@arbetsmarknad/components/Footer";
import { Main } from "@arbetsmarknad/components/Main";
import { Page } from "@arbetsmarknad/components/Page";
import { Section } from "@arbetsmarknad/components/Section";
import { SectionHeading } from "@arbetsmarknad/components/SectionHeading";
import { TopLevelHeading } from "@arbetsmarknad/components/TopLevelHeading";
import { loadAgreements } from "@/lib/agreements";
import { Agreement } from "@/lib/agreements";
import { Metadata } from "next";

type AgreementParams = {
  slug: string;
};

type AgreementProps = {
  params: Promise<Agreement>;
};

export async function generateStaticParams(): Promise<AgreementParams[]> {
  const agreements = await loadAgreements(process.env.SOURCE_DIRECTORY_PATH!);
  return agreements.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(
  props: AgreementProps,
): Promise<Metadata> {
  const params = await props.params;
  const agreements = await loadAgreements(process.env.SOURCE_DIRECTORY_PATH!);
  const agreement = agreements.find((a) => a.slug === params.slug)!;
  return {
    title: `${agreement.name} ${process.env.NEXT_PUBLIC_YEAR}`,
  };
}

export default async function AgreementPage(props: AgreementProps) {
  const params = await props.params;
  const agreements = await loadAgreements(process.env.SOURCE_DIRECTORY_PATH!);
  const agreement = agreements.find((a) => a.slug === params.slug)!;

  return (
    <Page>
      <HeaderMenu
        href="https://kollektivavtal.github.io"
        text="kollektivavtal.github.io"
      />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="https://arbetsmarknad.github.io">
              Arbetsmarknad
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Kollektivavtal</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${process.env.NEXT_PUBLIC_YEAR}`}>
              {process.env.NEXT_PUBLIC_YEAR}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/${process.env.NEXT_PUBLIC_YEAR}/${agreement.slug}`}
            >
              {agreement.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Main>
        <Container className="flex flex-col items-start space-y-8">
          <TopLevelHeading
            text={`${agreement.name} ${process.env.NEXT_PUBLIC_YEAR}`}
          />

          <Section>
            <SectionHeading>Dokument</SectionHeading>
            <DocumentList>
              {agreement.documents.map((document) => (
                <DocumentItem key={document.rank}>
                  <DocumentIcon
                    src={`/${process.env.NEXT_PUBLIC_YEAR}/${document.thumbnails.w64}`}
                  />
                  <DocumentLink
                    href={`/${process.env.NEXT_PUBLIC_YEAR}/${document.filename}`}
                  >
                    {document.name}
                  </DocumentLink>
                  <DocumentDescription>
                    {["PDF", `${(document.bytes / 1024).toFixed(2)} KB`].join(
                      ", ",
                    )}
                  </DocumentDescription>
                </DocumentItem>
              ))}
            </DocumentList>
          </Section>

          {agreement.sources.length > 0 ? (
            <Section>
              <SectionHeading>Källor</SectionHeading>
              <LinkList links={agreement.sources} />
            </Section>
          ) : (
            <></>
          )}
        </Container>
      </Main>
      <Footer
        sourceCode={[
          `kollektivavtal/${process.env.NEXT_PUBLIC_YEAR}`,
          "kollektivavtal/autoindex",
          "arbetsmarknad/components",
        ]}
      />
    </Page>
  );
}
