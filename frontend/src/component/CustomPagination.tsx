import { ButtonGroup, Center, IconButton, Pagination } from "@chakra-ui/react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import type { Pagination as PaginationData } from "../utils/types";
import { useEffect } from "react";

interface PaginationProps {
  pagination: PaginationData;
  page: number;
  onPageChange: (page: number) => void;
}

const CustomPagination = ({
  pagination,
  page,
  onPageChange,
}: PaginationProps) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <Center mt={8}>
      <Pagination.Root
        count={pagination.totalProducts}
        pageSize={pagination.pageSize}
        page={page} // just show me whatever i hand over to you
        onPageChange={(e) => onPageChange(e.page)}
      >
        <ButtonGroup variant="ghost" size="sm">
          <Pagination.PrevTrigger asChild>
            <IconButton>
              <LuChevronLeft />
            </IconButton>
          </Pagination.PrevTrigger>

          <Pagination.Items
            render={(item) => (
              <IconButton
                variant={{ base: "ghost", _selected: "outline" }}
                disabled={item.value === page}
              >
                {item.value}
              </IconButton>
            )}
          />

          <Pagination.NextTrigger asChild>
            <IconButton>
              <LuChevronRight />
            </IconButton>
          </Pagination.NextTrigger>
        </ButtonGroup>
      </Pagination.Root>
    </Center>
  );
};

export default CustomPagination;
