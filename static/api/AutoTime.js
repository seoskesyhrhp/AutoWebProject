export function postDay(row) {
  /**
   * 将传入的行数转换为以天为单位的时间（秒）
   *
   * @param row 行数
   * @returns 返回以天为单位的时间（秒）
   */
  return 60 * 60 * 24 * row;
}

export function postHour(row) {
  /**
   * 将传入的行数转换为以小时为单位的时间（秒）
   *
   * @param row 行数
   * @returns 返回以小时为单位的时间（秒）
   */
  return 60 * 60 * row;
}

export function postMinute(row) {
  /**
   * 将传入的行数转换为以分钟为单位的时间（秒）
   *
   * @param row 行数
   * @returns 返回以分钟为单位的时间（秒）
   */
  return 60 * row;
}
