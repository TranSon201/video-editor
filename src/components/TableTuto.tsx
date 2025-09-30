import { useEffect, useState } from "react";
import Papa from "papaparse";

export const TableTuto = (props: { csvData: string, showData: boolean, headerBgColor?: string, rowBgColor?: string, borderColor?: string }) => {
    const { csvData, showData, headerBgColor, rowBgColor, borderColor } = props;

    const [columns, setColumns] = useState<{ Header: string; accessor: string }[]>([]);
    const [data, setData] = useState<Record<string, any>[]>([]);

    useEffect(() => {
        const result = Papa.parse(csvData || "", {
            header: true,
            skipEmptyLines: true,
        });

        const fields = result.meta.fields || [];
        setColumns(fields.map((field) => ({
            Header: field.replace(/\\n/g, " \n "),
            accessor: field,
        })));

        setData((result.data as any[]) || []);
    }, [csvData]);

    return (
        <div className="w-full h-full overflow-hidden">
            {/* 
        font-size theo kích thước của div CHA nhờ container queries:
        - 1.6cqw: 1.6% chiều rộng container
        - 1.6cqh: 1.6% chiều cao container
        Bạn có thể tinh chỉnh 1.2 ~ 2.4 cho vừa ý.
      */}
            <div
                className="w-full h-full"
                style={{
                    fontSize: "clamp(10px, min(0.85cqw, 0.85cqh), 24px)",
                    lineHeight: 1.2,
                }}
            >
                <table  className={`w-full h-full table-fixed border-separate border-spacing-0 border-2  rounded shadow-md`}
                    style={{ borderColor: borderColor || "black" }}>
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.accessor}
                                    className={`border-b-2 border-r-2 text-left whitespace-pre-wrap align-top break-words
                             px-[0.8em] py-[0.6em] text-black`} style={{ backgroundColor: headerBgColor || "transparent", borderColor: borderColor || "black" }}>
                                    <div style={{ opacity: showData ? 1 : 0 }}>
                                        {column.Header}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="align-top">
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {columns.map((column) => {
                                    const raw = row?.[column.accessor];
                                    const text =
                                        typeof raw === "string" ? raw :
                                            raw != null ? String(raw) : "";
                                    return (
                                        <td
                                            key={column.accessor}
                                            className={`border-b-2 border-r-2  text-gray-800 whitespace-pre-wrap text-left break-words
                                 px-[0.8em] py-[0.6em] align-top`}
                                            style={{ backgroundColor: rowBgColor || "transparent" , borderColor: borderColor || "black" }}
                                        >
                                            <div style={{ opacity: showData ? 1 : 0 }}>
                                                {text.replaceAll(/\\n/g, "\n")}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TableTuto;
