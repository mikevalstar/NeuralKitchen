import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeMirrorEditor,
  CreateLink,
  codeBlockPlugin,
  codeMirrorPlugin,
  DiffSourceToggleWrapper,
  diffSourcePlugin,
  headingsPlugin,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  imagePlugin,
  ListsToggle,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  MDXEditor,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Start writing your content here...",
  className = "",
  minHeight = "400px",
}: MarkdownEditorProps) {
  return (
    <div className={`border rounded-lg ${className}`}>
      <MDXEditor
        markdown={value}
        onChange={onChange}
        contentEditableClassName={`min-h-[${minHeight}] p-4 max-w-none`}
        placeholder={placeholder}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin(),
          tablePlugin(),
          codeBlockPlugin({
            codeBlockEditorDescriptors: [{ priority: -10, match: (_) => true, Editor: CodeMirrorEditor }],
          }),
          codeMirrorPlugin({
            autoLoadLanguageSupport: true,
            // TODO: Figure out how to just have all the languages available
            codeBlockLanguages: {
              null: "Text",
              "": "Text",
              javascript: "JavaScript",
              js: "JavaScript",
              jsx: "JavaScript (react)",
              ts: "TypeScript",
              py: "Python",
              typescript: "TypeScript",
              tsx: "TypeScript (react)",
              bash: "Bash",
              sql: "SQL",
              python: "Python",
              json: "JSON",
              css: "CSS",
              html: "HTML",
              yaml: "YAML",
              markdown: "Markdown",
              text: "Text",
              plaintext: "Plaintext",
              dockerfile: "Dockerfile",
            },
          }),
          diffSourcePlugin({
            viewMode: "rich-text",
            diffMarkdown: "",
            readOnlyDiff: false,
          }),
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <UndoRedo />
                <BoldItalicUnderlineToggles />
                <BlockTypeSelect />
                <CreateLink />
                <InsertImage />
                <InsertTable />
                <InsertThematicBreak />
                <ListsToggle />
              </DiffSourceToggleWrapper>
            ),
          }),
        ]}
      />
    </div>
  );
}
