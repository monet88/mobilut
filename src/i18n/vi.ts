export const vi = {
  common: {
    save: 'Lưu',
    cancel: 'Hủy',
    done: 'Xong',
    retry: 'Thử lại',
    loading: 'Đang tải...',
  },
  errors: {
    import: {
      fileTooLarge: 'Tệp quá lớn. Kích thước tối đa là 50MB.',
      unsupportedFormat: 'Định dạng tệp này không được hỗ trợ.',
      permissionDenied: 'Quyền truy cập thư viện ảnh bị từ chối. Vui lòng bật trong Cài đặt.',
      invalidImage: 'Không thể mở ảnh này.',
      transparentPng: 'Ảnh PNG trong suốt có thể không hiển thị đúng.',
    },
    export: {
      writeFailed: 'Không thể lưu ảnh. Vui lòng thử lại.',
      permissionDenied: 'Quyền truy cập bộ nhớ bị từ chối. Vui lòng bật trong Cài đặt.',
      dimensionTooLarge: 'Ảnh quá lớn để xuất.',
      outOfMemory: 'Không đủ bộ nhớ để xuất ảnh này.',
    },
    lut: {
      parseFailed: 'Không thể đọc tệp LUT này.',
      unsupportedSize: 'Kích thước LUT này không được hỗ trợ.',
      invalidHald: 'Tệp HaldCLUT này không hợp lệ.',
      importFailed: 'Không thể nhập LUT này.',
    },
    render: {
      shaderFailed: 'Kết xuất thất bại. Vui lòng thử lại.',
      outOfMemory: 'Không đủ bộ nhớ để kết xuất.',
      exportFailed: 'Xuất thất bại. Vui lòng thử lại.',
    },
  },
  editor: {
    title: 'Chỉnh sửa',
    undo: 'Hoàn tác',
    redo: 'Làm lại',
    export: 'Xuất',
    compare: 'So sánh',
    presets: 'Bộ lọc',
    adjustments: 'Điều chỉnh',
    crop: 'Cắt',
    rotate: 'Xoay',
    framing: 'Khung',
    watermark: 'Hình mờ',
  },
  settings: {
    title: 'Cài đặt',
    language: 'Ngôn ngữ',
    exportQuality: 'Chất lượng xuất',
    watermark: 'Hình mờ',
  },
} as const;
