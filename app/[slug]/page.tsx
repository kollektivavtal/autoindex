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
import { Page } from "@arbetsmarknad/components/Page";
import { TopLevelHeading } from "@arbetsmarknad/components/TopLevelHeading";
import { loadAgreements } from "@/lib/agreements";
import { Agreement } from "@/lib/agreements";
import { Metadata } from "next";
import Head from "next/head";

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
  props: AgreementProps
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
      <Head>
        <link
          rel="icon"
          href={`/${process.env.NEXT_PUBLIC_YEAR}/${agreement.documents[0].thumbnails.w64}`}
        />
      </Head>
      <HeaderMenu
        href="https://kollektivavtal.github.io"
        text="kollektivavtal.github.io"
      />
      <Breadcrumb className="py-4 w-full flex justify-center">
        <Container>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Arbetsmarknad</BreadcrumbLink>
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
        </Container>
      </Breadcrumb>
      <main className="flex flex-col items-center w-full py-4">
        <Container className="flex flex-col items-start space-y-8">
          <TopLevelHeading
            text={`${agreement.name} ${process.env.NEXT_PUBLIC_YEAR}`}
          />

          <section className="flex flex-col items-start space-y-4">
            <h2 className="text-2xl font-bold">Dokument</h2>
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
                      ", "
                    )}
                  </DocumentDescription>
                </DocumentItem>
              ))}
            </DocumentList>
          </section>

          {agreement.sources.length > 0 ? (
            <section className="flex flex-col items-start space-y-4 max-w-full">
              <h2 className="text-2xl font-bold">Källor</h2>
              <LinkList links={agreement.sources} />
            </section>
          ) : (
            <></>
          )}
        </Container>
      </main>
    </Page>
  );
}
