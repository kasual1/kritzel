import { test, expect } from '../../fixtures/editor.fixture';

test.describe("Group objects", () => {
  test.beforeEach(async ({ editorPage }) => {
    await editorPage.goto();
    await editorPage.waitForReady();
  });

  test.describe("group", () => {
    test("should group two selected shapes into a KritzelGroup", async ({
      editorPage,
    }) => {
      const shape1 = await editorPage.addShape({
        shapeType: "rectangle",
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: "ellipse",
        translateX: 250,
        translateY: 100,
        width: 100,
        height: 100,
      });

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.group();
      await editorPage.clearSelection();

      const allObjects = await editorPage.getAllObjects<any>();
      const group = allObjects.find((o: any) => o.__class__ === "KritzelGroup");
      expect(group).toBeDefined();
    });

    test("should group three mixed objects (shape + text + path)", async ({
      editorPage,
    }) => {
      const shape = await editorPage.addShape({
        shapeType: "rectangle",
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });
      const text = await editorPage.addText({
        text: "Hello",
        translateX: 250,
        translateY: 100,
      });
      const path = await editorPage.addPath({
        points: [[0, 0], [50, 50], [100, 0]],
        translateX: 400,
        translateY: 100,
        strokeWidth: 3,
      });

      await editorPage.selectObjects([shape, text, path]);
      await editorPage.group();
      await editorPage.clearSelection();

      const allObjects = await editorPage.getAllObjects<any>();
      const group = allObjects.find((o: any) => o.__class__ === "KritzelGroup");
      expect(group).toBeDefined();
    });

    test("grouped object count should include group and its children", async ({
      editorPage,
    }) => {
      const shape1 = await editorPage.addShape({
        shapeType: "rectangle",
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: "ellipse",
        translateX: 250,
        translateY: 100,
        width: 100,
        height: 100,
      });

      expect(await editorPage.getObjectsTotalCount()).toBe(2);

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.group();
      await editorPage.clearSelection();

      // After grouping, the two shapes become children of a single group
      const countAfterGroup = await editorPage.getObjectsTotalCount();
      expect(countAfterGroup).toBe(3); // group + 2 children
    });

    test("child objects should still exist but be associated with the group", async ({
      editorPage,
    }) => {
      const shape1 = await editorPage.addShape({
        shapeType: "rectangle",
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
        fillColor: { light: "#ff0000", dark: "#ff0000" },
      });
      const shape2 = await editorPage.addShape({
        shapeType: "ellipse",
        translateX: 250,
        translateY: 100,
        width: 100,
        height: 100,
        fillColor: { light: "#0000ff", dark: "#0000ff" },
      });

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.group();
      await editorPage.clearSelection();

      const allObjects = await editorPage.getAllObjects<any>();
      const group = allObjects.find((o: any) => o.__class__ === "KritzelGroup");
      expect(group).toBeDefined();
      expect(group.childIds).toBeDefined();
      expect(group.childIds).toHaveLength(2);
    });
  });

  test.describe("ungroup", () => {
    test("should ungroup a group back into individual objects", async ({
      editorPage,
    }) => {
      const shape1 = await editorPage.addShape({
        shapeType: "rectangle",
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: "ellipse",
        translateX: 250,
        translateY: 100,
        width: 100,
        height: 100,
      });

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.group();
      await editorPage.clearSelection();

      // Now ungroup
      const allAfterGroup = await editorPage.getAllObjects<any>();
      const group = allAfterGroup.find(
        (o: any) => o.__class__ === "KritzelGroup",
      );
      await editorPage.selectObjects([group]);
      await editorPage.ungroup();
      await editorPage.clearSelection();

      const allAfterUngroup = await editorPage.getAllObjects<any>();
      const hasGroup = allAfterUngroup.some(
        (o: any) => o.__class__ === "KritzelGroup",
      );
      expect(hasGroup).toBe(false);
    });

    test("ungrouped objects should be independently selectable", async ({
      editorPage,
    }) => {
      const shape1 = await editorPage.addShape({
        shapeType: "rectangle",
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: "ellipse",
        translateX: 250,
        translateY: 100,
        width: 100,
        height: 100,
      });

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.group();
      await editorPage.clearSelection();

      const allAfterGroup = await editorPage.getAllObjects<any>();
      const group = allAfterGroup.find(
        (o: any) => o.__class__ === "KritzelGroup",
      );
      await editorPage.selectObjects([group]);
      await editorPage.ungroup();
      await editorPage.clearSelection();

      // Select just one of the ungrouped objects
      const allAfterUngroup = await editorPage.getAllObjects<any>();
      expect(allAfterUngroup.length).toBe(2);

      await editorPage.selectObjects([allAfterUngroup[0]]);
      const selected = await editorPage.getSelectedObjects<any>();
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe(allAfterUngroup[0].id);
    });

    test("object count should decrease after ungrouping", async ({
      editorPage,
    }) => {
      const shape1 = await editorPage.addShape({
        shapeType: "rectangle",
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: "ellipse",
        translateX: 250,
        translateY: 100,
        width: 100,
        height: 100,
      });

      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.group();
      await editorPage.clearSelection();

      expect(await editorPage.getObjectsTotalCount()).toBe(3); // group + 2 children

      const allAfterGroup = await editorPage.getAllObjects<any>();
      const group = allAfterGroup.find(
        (o: any) => o.__class__ === "KritzelGroup",
      );
      await editorPage.selectObjects([group]);
      await editorPage.ungroup();
      await editorPage.clearSelection();

      expect(await editorPage.getObjectsTotalCount()).toBe(2); // group removed, 2 shapes remain
    });
  });

  test.describe("nested groups", () => {
    test("should group a group with another object", async ({ editorPage }) => {
      const shape1 = await editorPage.addShape({
        shapeType: "rectangle",
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: "ellipse",
        translateX: 250,
        translateY: 100,
        width: 100,
        height: 100,
      });

      // Create first group
      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.group();
      await editorPage.clearSelection();

      const allAfterFirstGroup = await editorPage.getAllObjects<any>();
      const innerGroup = allAfterFirstGroup.find(
        (o: any) => o.__class__ === "KritzelGroup",
      );
      expect(innerGroup).toBeDefined();
      expect(innerGroup.childIds).toHaveLength(2);

      // Add another shape and group it with the existing group
      const shape3 = await editorPage.addShape({
        shapeType: "triangle",
        translateX: 400,
        translateY: 100,
        width: 100,
        height: 100,
      });

      await editorPage.selectObjects([innerGroup, shape3]);
      await editorPage.group();
      await editorPage.clearSelection();

      const allAfterNestedGroup = await editorPage.getAllObjects<any>();
      const groups = allAfterNestedGroup.filter(
        (o: any) => o.__class__ === "KritzelGroup",
      );
      expect(groups).toHaveLength(2);
      expect(allAfterNestedGroup).toHaveLength(5);

      const outerGroup = groups.find((g: any) =>
        g.childIds.includes(innerGroup.id),
      );
      expect(outerGroup).toBeDefined();
      expect(outerGroup.childIds).toHaveLength(2);
    });

    test("should ungroup only the top-level group", async ({ editorPage }) => {
      const shape1 = await editorPage.addShape({
        shapeType: "rectangle",
        translateX: 100,
        translateY: 100,
        width: 100,
        height: 100,
      });
      const shape2 = await editorPage.addShape({
        shapeType: "ellipse",
        translateX: 250,
        translateY: 100,
        width: 100,
        height: 100,
      });

      // Create inner group
      await editorPage.selectObjects([shape1, shape2]);
      await editorPage.group();
      await editorPage.clearSelection();

      const allAfterFirstGroup = await editorPage.getAllObjects<any>();
      const innerGroup = allAfterFirstGroup.find(
        (o: any) => o.__class__ === "KritzelGroup",
      );
      expect(innerGroup).toBeDefined();
      expect(innerGroup.childIds).toHaveLength(2);

      // Add a third shape and create outer group
      const shape3 = await editorPage.addShape({
        shapeType: "triangle",
        translateX: 400,
        translateY: 100,
        width: 100,
        height: 100,
      });

      await editorPage.selectObjects([innerGroup, shape3]);
      await editorPage.group();
      await editorPage.clearSelection();

      const allAfterNestedGroup = await editorPage.getAllObjects<any>();
      let groupsAfterNestedGroup = allAfterNestedGroup.filter(
        (o: any) => o.__class__ === "KritzelGroup",
      );
      expect(groupsAfterNestedGroup).toHaveLength(2);
      expect(allAfterNestedGroup).toHaveLength(5); // 2 groups + 3 shapes

      // Ungroup the outer group
      const outerGroup = allAfterNestedGroup.find(
        (o: any) =>
          o.__class__ === "KritzelGroup" && o.childIds.includes(innerGroup.id),
      );
      await editorPage.selectObjects([outerGroup]);
      await editorPage.ungroup();
      await editorPage.clearSelection();

      // After ungrouping top-level, we should have the inner group + shape3
      const allAfterUngroup = await editorPage.getAllObjects<any>();
      const groupsAfterUngroup = allAfterUngroup.filter(
        (o: any) => o.__class__ === "KritzelGroup",
      );
      expect(groupsAfterUngroup).toHaveLength(1);
      expect(allAfterUngroup).toHaveLength(4); // 1 group + 3 shapes

      // The inner group should still exist
      const remainingGroup = allAfterUngroup.find(
        (o: any) => o.__class__ === "KritzelGroup",
      );
      expect(remainingGroup).toBeDefined();
      expect(remainingGroup.childIds).toHaveLength(2);
    });
  });

  test.describe("visual regression", () => {
    test("grouped objects", async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: "rectangle",
        translateX: 100,
        translateY: 100,
        width: 150,
        height: 100,
        fillColor: { light: "#4a90d9", dark: "#4a90d9" },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: "ellipse",
        translateX: 300,
        translateY: 100,
        width: 150,
        height: 100,
        fillColor: { light: "#d94a4a", dark: "#d94a4a" },
      });

      await editorPage.waitForObjectsAdded();

      const allObjects = await editorPage.getAllObjects<any>();
      await editorPage.selectObjects(allObjects);
      await editorPage.group();

      await editorPage.clearSelection();

      await editorPage.page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );

      await expect(editorPage.engine).toHaveScreenshot();
    });

    test("grouped objects selected", async ({ editorPage }) => {
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: "rectangle",
        translateX: 100,
        translateY: 100,
        width: 150,
        height: 100,
        fillColor: { light: "#4a90d9", dark: "#4a90d9" },
      });

      await editorPage.waitForObjectsAdded();
      await editorPage.prepareWaitForObjectsAdded();

      await editorPage.addShape({
        shapeType: "ellipse",
        translateX: 300,
        translateY: 100,
        width: 150,
        height: 100,
        fillColor: { light: "#d94a4a", dark: "#d94a4a" },
      });

      await editorPage.waitForObjectsAdded();

      const allObjects = await editorPage.getAllObjects<any>();
      await editorPage.selectObjects(allObjects);
      await editorPage.group();

      // Select the group to show selection handles
      const allAfterGroup = await editorPage.getAllObjects<any>();
      const group = allAfterGroup.find(
        (o: any) => o.__class__ === "KritzelGroup",
      );
      await editorPage.selectObjects([group]);

      await editorPage.page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );

      await expect(editorPage.engine).toHaveScreenshot();
    });
  });
});
