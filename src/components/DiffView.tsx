import * as Diff from "diff";
import { Expand, Minimize } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import type { Project, RecipeVersion, Tag } from "~/generated/prisma";

type VersionWithRelations = RecipeVersion & {
  tags: Tag[];
  projects: Project[];
};

interface DiffViewProps {
  version1: VersionWithRelations;
  version2: VersionWithRelations;
  onRestore: (version: VersionWithRelations) => void;
}

export function DiffView({ version1, version2, onRestore }: DiffViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate diff between the two versions
  const diff = Diff.createPatch("", version1.content, version2.content, version1.versionId, version2.versionId);
  const parsedDiff = Diff.parsePatch(diff)[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Diff View</CardTitle>
            <CardDescription>
              Changes from {version1.versionId} to {version2.versionId}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? (
                <>
                  <Minimize className="h-4 w-4 mr-2" />
                  Show Changes Only
                </>
              ) : (
                <>
                  <Expand className="h-4 w-4 mr-2" />
                  Show Full Document
                </>
              )}
            </Button>
            {!version1.isCurrent && (
              <Button variant="outline" size="sm" onClick={() => onRestore(version1)}>
                Restore {version1.versionId}
              </Button>
            )}
            {!version2.isCurrent && (
              <Button variant="outline" size="sm" onClick={() => onRestore(version2)}>
                Restore {version2.versionId}
              </Button>
            )}
          </div>
        </div>
        {(version1.comment || version2.comment) && (
          <div className="space-y-1">
            {version1.comment && (
              <div className="text-sm italic text-muted-foreground">
                {version1.versionId}: "{version1.comment}"
              </div>
            )}
            {version2.comment && (
              <div className="text-sm italic text-muted-foreground">
                {version2.versionId}: "{version2.comment}"
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isExpanded ? (
          <FullFileView version1={version1} version2={version2} />
        ) : (
          <div className="bg-muted/30 rounded-md p-4 font-mono text-sm overflow-x-auto">
            {parsedDiff.hunks.map((hunk, hunkIndex) => (
              <div key={`hunk-${hunk.oldStart}-${hunk.newStart}-${hunkIndex}`} className="mb-4">
                <div className="text-muted-foreground text-xs mb-2">
                  @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                </div>
                {hunk.lines.map((line, lineIndex) => {
                  const lineType = line[0];
                  const content = line.slice(1);

                  return (
                    <div
                      key={`line-${hunk.oldStart}-${lineIndex}-${content.slice(0, 20)}`}
                      className={`${
                        lineType === "+"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                          : lineType === "-"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                            : ""
                      } px-2 py-0.5`}>
                      <span className="select-none text-muted-foreground mr-2">
                        {lineType === "+" ? "+" : lineType === "-" ? "-" : " "}
                      </span>
                      {content}
                    </div>
                  );
                })}
              </div>
            ))}
            {parsedDiff.hunks.length === 0 && (
              <div className="text-muted-foreground text-center py-4">No differences found between versions</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FullFileView({ version1, version2 }: { version1: VersionWithRelations; version2: VersionWithRelations }) {
  // Split content into lines
  const lines1 = version1.content.split("\n");
  const lines2 = version2.content.split("\n");
  const maxLines = Math.max(lines1.length, lines2.length);

  // Future: could use word-level diff to highlight changes within lines

  // Create line-by-line comparison with highlighting
  const getLineHighlight = (lineIndex: number, content: string, isVersion2: boolean) => {
    // Simple approach: check if this line differs from the corresponding line in the other version
    const otherLines = isVersion2 ? lines1 : lines2;
    const otherLine = otherLines[lineIndex] || "";

    if (content !== otherLine) {
      return isVersion2
        ? "bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500"
        : "bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500";
    }
    return "";
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Version 1 */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground border-b pb-2">{version1.versionId} (Old)</div>
        <div className="bg-muted/30 rounded-md p-4 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
          {Array.from({ length: maxLines }, (_, i) => {
            const line = lines1[i] || "";
            const highlight = getLineHighlight(i, line, false);
            return (
              <div key={`v1-line-${i}`} className={`px-2 py-0.5 ${highlight}`}>
                <span className="select-none text-muted-foreground mr-3 w-8 inline-block text-right">
                  {line ? i + 1 : ""}
                </span>
                {line || "\u00A0"}
              </div>
            );
          })}
        </div>
      </div>

      {/* Version 2 */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground border-b pb-2">{version2.versionId} (New)</div>
        <div className="bg-muted/30 rounded-md p-4 font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
          {Array.from({ length: maxLines }, (_, i) => {
            const line = lines2[i] || "";
            const highlight = getLineHighlight(i, line, true);
            return (
              <div key={`v2-line-${i}`} className={`px-2 py-0.5 ${highlight}`}>
                <span className="select-none text-muted-foreground mr-3 w-8 inline-block text-right">
                  {line ? i + 1 : ""}
                </span>
                {line || "\u00A0"}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
