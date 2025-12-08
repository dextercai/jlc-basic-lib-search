"use client";
import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  AppShell,
  TextInput,
  Paper,
  Table,
  ScrollArea,
  Group,
  Button,
  Select,
  Burger,
  Title,
  Switch,
  useComputedColorScheme,
  useMantineColorScheme,
  Badge,
} from "@mantine/core";
import { notifications, showNotification } from "@mantine/notifications";
import { IconCopy, IconMoon, IconSun } from "@tabler/icons-react";

type ComponentItem = {
  编号: string;
  名称: string;
  型号: string;
  封装: string;
  品牌: string;
};

export default function App() {
  const [data, setData] = useState<ComponentItem[]>([]);
  const [filter, setFilter] = useState("");
  const [sortIndex, setSortIndex] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(15);

  useEffect(() => {
    notifications.show({
      message: "原始数据来源于：https://www.jlc-smt.com/lcsc/basic",
      withBorder: true,
      autoClose: 4000,
      position: "bottom-center",
    });
  }, []);

  // 从 public 目录读取 Excel
  useEffect(() => {
    const fetchExcel = async () => {
      const res = await fetch("/data.xlsx");
      const arrayBuffer = await res.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);

      const parsed: ComponentItem[] = json.map((row) => ({
        编号: row["元器件编号"] || "",
        名称: row["元器件名称"] || "",
        型号: row["元器件型号"] || "",
        封装: row["元器件封装"] || "",
        品牌: row["品牌"] || "",
      }));

      setData(parsed);
      setPage(1);
    };

    fetchExcel();
  }, []);

  // 多条件筛选 + 排序
  const filteredSortedData = useMemo(() => {
    let rows = [...data];

    // 多条件筛选
    if (filter.trim() !== "") {
      const keywords = filter.trim().toLowerCase().split(/\s+/).filter(Boolean);
      rows = rows.filter((row) =>
        keywords.every((kw) =>
          Object.values(row).some((val) =>
            val.toString().toLowerCase().includes(kw)
          )
        )
      );
    }

    // 排序
    if (sortIndex !== null) {
      const keys: (keyof ComponentItem)[] = ["编号", "名称", "型号", "封装", "品牌"];
      const key = keys[sortIndex];
      rows.sort((a, b) => {
        if (a[key] < b[key]) return sortAsc ? -1 : 1;
        if (a[key] > b[key]) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [data, filter, sortIndex, sortAsc]);

  // 分页
  const totalPages =
    pageSize === "all"
      ? 1
      : Math.max(1, Math.ceil(filteredSortedData.length / pageSize));

  const paginatedData = useMemo(() => {
    if (pageSize === "all") return filteredSortedData;
    const start = (page - 1) * pageSize;
    return filteredSortedData.slice(start, start + pageSize);
  }, [filteredSortedData, page, pageSize]);

  // 复制单元格
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification({
        message: `已复制: ${text}`,
        color: "green",
        icon: <IconCopy size={16} />,
        autoClose: 1500,
      });
    } catch {
      showNotification({
        message: "复制失败",
        color: "red",
        autoClose: 1500,
      });
    }
  };

  // 列头点击排序
  const handleSort = (index: number) => {
    if (sortIndex === index) {
      setSortAsc(!sortAsc);
    } else {
      setSortIndex(index);
      setSortAsc(true);
    }
    setPage(1);
  };

  const columns: (keyof ComponentItem)[] = ["编号", "名称", "型号", "封装", "品牌"];
  const theme = useComputedColorScheme("light");
  const { setColorScheme } = useMantineColorScheme();

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group px="md" h="100%" justify="space-between">
          <Title order={4}>基础元器件库查询</Title>
          <Switch
            checked={theme === "dark"}
            onChange={() =>
              setColorScheme(theme === "dark" ? "light" : "dark")
            }
            onLabel={<IconSun size={14} />}
            offLabel={<IconMoon size={14} />}
          />
        </Group>
      </AppShell.Header>
      <AppShell.Main>
      <Paper shadow="xs" p="md" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Group mb="sm" wrap="wrap">
          <TextInput
            placeholder="搜索元器件（空格分隔多条件）"
            value={filter}
            onChange={(e) => {
              setFilter(e.currentTarget.value);
              setPage(1);
            }}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Badge>共 {data.length} / 筛 {filteredSortedData.length}</Badge>
          <Group  align="center">
            <Button
              size="xs"
              disabled={page <= 1 || pageSize === "all"}
              onClick={() => setPage(page - 1)}
            >
              上一页
            </Button>
            <span>
              {page} / {totalPages}
            </span>
            <Button
              size="xs"
              disabled={page >= totalPages || pageSize === "all"}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </Button>
            <Select
              size="xs"
              value={pageSize === "all" ? "all" : pageSize.toString()}
              onChange={(val) => {
                if (val === "all") {
                  setPageSize("all");
                  setPage(1);
                } else {
                  setPageSize(Number(val));
                  setPage(1);
                }
              }}
              data={[
                { value: "15", label: "15 行/页" },
                { value: "30", label: "30 行/页" },
                { value: "60", label: "60 行/页" },
                { value: "all", label: "全部" },
              ]}
            />
          </Group>
        </Group>

        <ScrollArea >
          <Table striped highlightOnHover verticalSpacing="xs" >
            <Table.Thead>
              <tr>
                {columns.map((col, index) => (
                  <th
                    key={col}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSort(index)}
                  >
                    {col}
                    {sortIndex === index ? (sortAsc ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedData.map((row, rowIndex) => (
                <Table.Tr key={rowIndex}>
                  {columns.map((col) => (
                    <Table.Td
                      key={col}
                      style={{ cursor: "pointer" }}
                      onDoubleClick={() => handleCopy(row[col])}
                      title="双击复制"
                    >
                      {row[col]}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
      </AppShell.Main>
    </AppShell>
  );
}
