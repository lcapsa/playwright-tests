import * as cheerio from "cheerio";
import fetch from "node-fetch";

interface CharPosition {
  x: number;
  y: number;
  char: string;
}

async function fetchDocHtml(docUrl: string): Promise<string> {
  const response = await fetch(docUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch document at ${docUrl}: ${response.status} ${response.statusText}`,
    );
  }

  return response.text();
}

function parseCharPositions(html: string): CharPosition[] {
  const documentQuery = cheerio.load(html);
  let headerIndexes: { x: number; char: number; y: number } | null = null;
  let characterTable: any = null;

  documentQuery("table").each((_, tableElement) => {
    if (headerIndexes) return;

    const rows = documentQuery(tableElement).find("tr");
    if (rows.length === 0) return;

    const headerCells = rows
      .first()
      .find("td, th")
      .map((__, cell) => documentQuery(cell).text().trim().toLowerCase())
      .get();

    const xIndex = headerCells.findIndex((header) =>
      header.includes("x-coordinate"),
    );
    const yIndex = headerCells.findIndex((header) =>
      header.includes("y-coordinate"),
    );
    const characterIndex = headerCells.findIndex((header) =>
      header.includes("character"),
    );

    if (xIndex !== -1 && yIndex !== -1 && characterIndex !== -1) {
      headerIndexes = { x: xIndex, char: characterIndex, y: yIndex };
      characterTable = documentQuery(tableElement);
    }
  });

  if (!headerIndexes || !characterTable) {
    throw new Error(
      "Could not find a table with 'x-coordinate', 'Character', and 'y-coordinate' columns in the document.",
    );
  }

  const { x: xIndex, char: characterIndex, y: yIndex } = headerIndexes;
  const positions: CharPosition[] = [];

  characterTable
    .find("tr")
    .slice(1)
    .each((_, row) => {
      const cells = documentQuery(row)
        .find("td, th")
        .map((__, cell) => documentQuery(cell).text())
        .get();

      if (cells.length <= Math.max(xIndex, characterIndex, yIndex)) {
        return;
      }

      const x = parseInt(cells[xIndex].trim(), 10);
      const y = parseInt(cells[yIndex].trim(), 10);
      const character = cells[characterIndex];
      const trimmedCharacter = character.trim();

      if (Number.isNaN(x) || Number.isNaN(y) || character.length === 0) {
        return;
      }

      positions.push({
        x,
        y,
        char: trimmedCharacter.length > 0 ? trimmedCharacter : character,
      });
    });

  return positions;
}

function buildGrid(positions: CharPosition[]): string[][] {
  if (positions.length === 0) {
    return [];
  }

  const maxX = Math.max(...positions.map((position) => position.x));
  const maxY = Math.max(...positions.map((position) => position.y));

  const grid = Array.from({ length: maxY + 1 }, () =>
    Array.from({ length: maxX + 1 }, () => " "),
  );

  for (const { x, y, char } of positions) {
    grid[y][x] = char;
  }

  return grid;
}

function renderGrid(grid: string[][]): string {
  const lines: string[] = [];

  for (let y = grid.length - 1; y >= 0; y--) {
    lines.push(grid[y].join(""));
  }

  return lines.join("\n");
}

async function printSecretMessage(docUrl: string): Promise<void> {
  const html = await fetchDocHtml(docUrl);
  const positions = parseCharPositions(html);
  const grid = buildGrid(positions);
  const renderedMessage = renderGrid(grid);

  console.log(renderedMessage);
}

const documentUrl = process.argv[2];

if (!documentUrl) {
  throw new Error("Please provide a published Google Doc URL.");
}

printSecretMessage(documentUrl).catch((error) => {
  console.error(error);
  process.exit(1);
});
