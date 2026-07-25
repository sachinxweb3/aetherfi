export default function EmptyInspector() {
  return (
    <div className="flex h-full items-center justify-center text-center">
      <div>
        <h3 className="text-lg font-semibold">
          No node selected
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Select a workflow node to inspect and edit
          its configuration.
        </p>
      </div>
    </div>
  );
}