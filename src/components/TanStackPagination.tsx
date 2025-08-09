import { Link, type LinkProps } from "@tanstack/react-router";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

interface TanStackPaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams?: Record<string, string | number | boolean | undefined>;
  maxVisiblePages?: number;
}

export function TanStackPagination({
  currentPage,
  totalPages,
  searchParams = {},
  maxVisiblePages = 5,
}: TanStackPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const createPageLink = (page: number): LinkProps => {
    return {
      to: ".",
      search: {
        ...searchParams,
        page: page > 1 ? page : undefined,
      },
    };
  };

  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("ellipsis");
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("ellipsis");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <Pagination>
      <PaginationContent>
        {hasPrevious && (
          <PaginationItem>
            <Link {...createPageLink(currentPage - 1)}>
              <PaginationPrevious />
            </Link>
          </PaginationItem>
        )}

        {visiblePages.map((page, index) => (
          <PaginationItem key={page === "ellipsis" ? `ellipsis-${index}` : `page-${page}`}>
            {page === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <Link {...createPageLink(page)}>
                <PaginationLink isActive={page === currentPage}>{page}</PaginationLink>
              </Link>
            )}
          </PaginationItem>
        ))}

        {hasNext && (
          <PaginationItem>
            <Link {...createPageLink(currentPage + 1)}>
              <PaginationNext />
            </Link>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
