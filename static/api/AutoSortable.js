function FuncdragAndDropIsAllowed(_self) {
  /*
   * @description: 判断是否允许拖拽排序
   * @param {type} true | false
   * @return {type} {true:不允许拖拽，false:允许拖拽}
   */
  _self.dragAndDropIsAllowed = true;
  return true;
}

export function sortInit(_self) {
  window.onload = () => {
    if (FuncdragAndDropIsAllowed(_self)) return;
    _self.tableRef = null;
    _self.sortableRow = null;
    _self.sortableColumn = null;
    onSortableRow(_self);
    onSortableColumn(_self);
  };
}
function onSortableRow(_self) {
  _self.sortableRow = Sortable.create(_self.$refs.multipleTable.$el.querySelector(".el-table__body-wrapper tbody"), {
    animation: 150,
    onEnd: ({ newIndex, oldIndex }) => {
      const currRow = _self.tableData.splice(oldIndex, 1)[0];
      _self.tableData.splice(newIndex, 0, currRow);
    },
  });
}

function onSortableColumn(_self) {
  _self.sortableColumn = Sortable.create(_self.$refs.multipleTable.$el.querySelector(".el-table__header-wrapper thead tr"), {
    animation: 150,
    onEnd: ({ newIndex, oldIndex }) => {
      const table = _self.$refs.multipleTable;
      let oldColumns = table.store.states.columns;
      const newColumns = [...oldColumns];
      const movedColumn = newColumns.splice(oldIndex, 1)[0];
      newColumns.splice(newIndex, 0, movedColumn);
      oldColumns = newColumns;
      _self.$set(table.store.states, "columns", oldColumns);
    },
  });
}
const onSortableColumns = () => {
  sortableColumn.value = Sortable.create(tableRef.value.$el.querySelector(".el-table__header-wrapper thead tr"), {
    animation: 150,
    onEnd: ({ newIndex, oldIndex }) => {
      const table = tableRef.value;
      // console.log(table.store, "oldColumn");
      // const columns = _self.$refs.multipleTable.$children[0].columns;
      // const movedColumn = columns.splice(oldIndex, 1)[0];
      // columns.splice(newIndex, 0, movedColumn);
      const oldColumns = table.store.states.columns;
      const newColumns = [...oldColumns.value];
      const movedColumn = newColumns.splice(oldIndex, 1)[0];
      newColumns.splice(newIndex, 0, movedColumn);
      oldColumns.value = newColumns;
    },
  });
};
