export default class MemoryMonitor {
  constructor(_self) {
    this._self = _self;
    this.monitoringInterval = null;
    this.cleanupCallbacks = [];
    this.maxMemoryMB = 100; // 内存阈值
    this.checkInterval = 30000; // 检查间隔
    this.cleanupHistory = []; // 清理历史记录
    this.leakDetectionThreshold = 3; // 内存泄漏检测阈值

    // 绑定方法
    this.initPerformanceMonitoring = this.initPerformanceMonitoring.bind(this);
    this.optimizeMemoryUsage = this.optimizeMemoryUsage.bind(this);
    this.addCleanupCallback = this.addCleanupCallback.bind(this);
    this.forceCleanup = this.forceCleanup.bind(this);
  }

  initPerformanceMonitoring() {
    // 先停止已有的监控
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // 检查浏览器是否支持内存监控
    if (!performance.memory) {
      console.warn("当前浏览器不支持 performance.memory API");
      return;
    }

    this.monitoringInterval = setInterval(() => {
      try {
        this.checkMemoryUsage();
      } catch (error) {
        console.error("内存监控出错:", error);
      }
    }, this.checkInterval);

    // 监听页面可见性变化，在页面隐藏时进行清理
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.optimizeMemoryUsage();
      }
    });

    // 监听页面卸载事件
    window.addEventListener("beforeunload", () => {
      this.forceCleanup();
    });

    console.log("内存监控已启动");
  }

  checkMemoryUsage() {
    const memory = performance.memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
    const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
    const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);

    const memoryUsage = (usedMB / limitMB) * 100;

    // 记录内存使用情况
    this.cleanupHistory.push({
      timestamp: new Date().toISOString(),
      usedMB,
      totalMB,
      limitMB,
      memoryUsage: memoryUsage.toFixed(1),
    });

    // 只保留最近10条记录
    if (this.cleanupHistory.length > 10) {
      this.cleanupHistory = this.cleanupHistory.slice(-10);
    }

    console.log(`内存使用: ${usedMB}MB / ${totalMB}MB (${memoryUsage.toFixed(1)}%)`);

    // 内存使用率超过80%或绝对数值超过阈值时触发清理
    if (memoryUsage > 80 || usedMB > this.maxMemoryMB) {
      console.warn(`内存使用较高: ${usedMB}MB (${memoryUsage.toFixed(1)}%)，触发清理`);
      this.optimizeMemoryUsage();

      // 检查内存泄漏模式
      this.checkMemoryLeak();
    }
  }

  checkMemoryLeak() {
    if (this.cleanupHistory.length < this.leakDetectionThreshold) return;

    const recentRecords = this.cleanupHistory.slice(-this.leakDetectionThreshold);
    const increasingTrend = recentRecords.every((record, index) => {
      if (index === 0) return true;
      return parseFloat(record.memoryUsage) > parseFloat(recentRecords[index - 1].memoryUsage);
    });

    if (increasingTrend) {
      console.error("检测到可能的内存泄漏趋势！");
      // 这里可以触发更严格的清理或发送错误报告
      this.forceCleanup();
    }
  }

  addCleanupCallback(callback) {
    if (typeof callback === "function") {
      this.cleanupCallbacks.push(callback);
    }
  }

  optimizeMemoryUsage() {
    console.log("开始内存优化...");
    const startTime = performance.now();
    let cleanedItems = 0;

    try {
      // 1. 清理图片缓存
      if (this.imageCache && typeof this.imageCache.clear === "function") {
        this.imageCache.clear();
        cleanedItems++;
        console.log("清理图片缓存");
      }

      // 2. 清理预览数据
      if (Array.isArray(this.previewImages)) {
        const previewCount = this.previewImages.length;
        this.previewImages = [];
        cleanedItems++;
        console.log(`清理预览图片: ${previewCount} 个`);
      }

      // 3. 执行注册的清理回调
      this.cleanupCallbacks.forEach((callback, index) => {
        try {
          const result = callback();
          if (result) cleanedItems++;
          console.log(`执行清理回调 ${index + 1}`);
        } catch (error) {
          console.error(`清理回调 ${index + 1} 执行失败:`, error);
        }
      });

      // 4. 清理事件监听器（需要具体实现）
      this.cleanupEventListeners();

      // 5. 清理定时器
      this.cleanupTimers();

      // 6. 删除大的DOM元素引用
      this.cleanupDOMReferences();

      // 7. 强制垃圾回收（如果支持）
      this.triggerGarbageCollection();

      const endTime = performance.now();
      console.log(`内存优化完成，清理了 ${cleanedItems} 个项目，耗时 ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error("内存优化过程中出错:", error);
    }
  }
  handleKeyDown(e) {
    if (!this.dialogVisible) return;

    const key = e.ctrlKey ? `ctrl+${e.key.toLowerCase()}` : e.key.toLowerCase();
    console.log("键盘事件:", key, e.ctrlKey, e.key);

    // 显示快捷键提示
    this.showKeyboardHints = true;
    setTimeout(() => {
      this.showKeyboardHints = false;
    }, 2000);

    switch (key) {
      case "ctrl+a":
        e.preventDefault();
        this.selectAllPhotosInCurrentView();
        break;
      case "ctrl+d":
        e.preventDefault();
        this.clearAllSelections();
        break;
      case "delete":
        e.preventDefault();
        if (this.hasSelectedPhotos) {
          this.handleDeletePhotos();
        }
        break;
      case "backspace":
        e.preventDefault();
        if (this.hasSelectedPhotos) {
          this.handleDeletePhotos();
        }
        break;
      case "escape":
        e.preventDefault();
        this.dialogVisible = false;
        break;
    }
  }

  cleanupEventListeners() {
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  cleanupTimers() {
    if (this._self.watermarkTimer) {
      clearInterval(this._self.watermarkTimer);
      delete this._self.watermarkTimer;
    }
  }

  cleanupDOMReferences() {
    // 清理对DOM元素的大对象引用
    try {
      // 示例：清理大的数据属性
      Object.keys(this).forEach((key) => {
        if (this[key] && typeof this[key] === "object" && this[key].nodeType) {
          this[key] = null;
        }
      });
    } catch (error) {
      console.error("清理DOM引用失败:", error);
    }
  }

  triggerGarbageCollection() {
    // 多种方式尝试触发垃圾回收
    try {
      // 方式1: 标准方式（Chrome）
      if (window.gc) {
        window.gc();
        console.log("触发强制垃圾回收");
        return;
      }

      // 方式2: 尝试通过创建大量对象来触发GC
      if (window.chrome && window.chrome.memory) {
        try {
          // Chrome的内存API
          window.chrome.memory && window.chrome.memory.collectGarbage();
        } catch (e) {
          // 忽略错误
        }
      }

      // 方式3: 通过循环引用来触发GC
      this.triggerGCByAllocation();
    } catch (error) {
      console.warn("触发垃圾回收失败:", error);
    }
  }

  triggerGCByAllocation() {
    // 通过分配和释放大量内存来"鼓励"GC运行
    try {
      const largeArray = new Array(1000000).fill(null);
      setTimeout(() => {
        largeArray.length = 0;
      }, 100);
    } catch (error) {
      // 忽略内存分配错误
    }
  }

  forceCleanup() {
    console.log("执行强制内存清理...");

    // 执行完整的清理流程
    this.optimizeMemoryUsage();

    // 额外的强制清理措施
    try {
      // 清空所有数组
      Object.keys(this).forEach((key) => {
        if (Array.isArray(this[key])) {
          this[key].length = 0;
        }
      });

      // 删除大的缓存对象
      Object.keys(this).forEach((key) => {
        if (this[key] && typeof this[key] === "object" && Object.keys(this[key]).length > 100) {
          this[key] = {};
        }
      });

      console.log("强制内存清理完成");
    } catch (error) {
      console.error("强制内存清理失败:", error);
    }
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log("内存监控已停止");
    }
  }

  getMemoryStats() {
    if (!performance.memory) return null;

    const memory = performance.memory;
    return {
      usedMB: Math.round(memory.usedJSHeapSize / 1048576),
      totalMB: Math.round(memory.totalJSHeapSize / 1048576),
      limitMB: Math.round(memory.jsHeapSizeLimit / 1048576),
      usagePercentage: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1),
    };
  }
}

// 初始化性能监控
export function memoryMonitoring() {
  console.log("开始内存监控...");
  if (performance.memory) {
    setInterval(() => {
      const memory = performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);

      if (usedMB > 100) {
        // 如果内存使用超过100MB
        console.warn(`内存使用较高: ${usedMB}MB / ${totalMB}MB,form: memoryMonitoring`);
        optimizeMemoryUsage.call(this);
      }
    }, 30000); // 每30秒检查一次
  }
}

// 优化内存使用
function optimizeMemoryUsage() {
  // 清理图片缓存
  this.imageCache.clear();

  // 清理未使用的预览数据
  this.previewImages = [];

  // 强制垃圾回收（如果支持）
  if (window.gc) {
    window.gc();
  }

  console.log("内存优化完成");
}
