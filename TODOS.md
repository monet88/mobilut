# TODOS

Checklist này bám theo plan đã được `ralplan` approve trong:
- `.omx/plans/prd-lut-app-de-risked-build-20260415T034727Z.md`
- `.omx/plans/test-spec-lut-app-de-risked-build-20260415T034727Z.md`

## Now: Gate trước khi build

- [ ] Chạy "The Assignment"
  Mục tiêu: nói chuyện với user thật trước khi commit vào product direction.
- [ ] Đăng vào 3 Facebook group nhiếp ảnh VN phù hợp.
- [ ] Thu ít nhất 20 câu trả lời.
- [ ] Tổng hợp kết quả vào `docs/market-validation.md`.
- [ ] Chốt quyết định `go / no-go / pivot` trong `docs/market-validation.md`.

- [ ] Resolve LUT licensing cho preset bundle.
- [ ] Ghi rõ nguồn LUT, quyền commercial use, và giới hạn bundling vào `docs/licensing.md`.
- [ ] Nếu chưa đủ quyền cho 200 LUT, ghi rõ phương án fallback: ship bản import-first + minimal built-in set.

- [ ] Chọn tên app chính thức thay cho `lut-app`.
- [ ] Ghi app name, naming constraints, store naming options vào `docs/brand.md`.

## Phase 1a: Rendering Core Spec

- [ ] Viết `docs/lut-encoding-spec.md`.
  Scope tối thiểu:
  - index convention
  - texel centering
  - strip layout
  - round-trip expectations
  - LUT sizes support: `33` và `64`

- [ ] Chốt boundary kiến trúc: parsing/encoding/interpolation nằm ở `packages/lut-core/`, app-specific rendering/state nằm ở `src/`.
- [ ] Port hoặc formalize behavior tham chiếu từ `tools/cube_to_hald.py`.
- [ ] Tạo fixture/source of truth từ các file hiện có trong `tools/`.
- [ ] Chốt supported / unsupported matrix cho `.cube` và HaldCLUT PNG.

- [ ] Viết `docs/adr/0001-rendering-pipeline.md`.
  Scope tối thiểu:
  - GPU-first bằng Skia
  - CPU fallback
  - khi nào fallback được phép chạy

- [ ] Viết `docs/adr/0002-lut-asset-bundling.md`.
  Scope tối thiểu:
  - built-in LUT asset format
  - thumbnail strategy
  - APK size constraints

- [ ] Chốt preview decode policy.
- [ ] Chốt full-resolution export policy.
- [ ] Quyết định tiled export / background export có phải bắt buộc cho launch không.

## Phase 1b: Runtime Harness Trên Stack Thật

- [ ] Init Expo bare shell tối thiểu để test runtime thật.
- [ ] Tích hợp Skia vào harness Android.
- [ ] Kết nối `packages/lut-core/` vào harness.
- [ ] Tạo harness để load fixture, chạy shader path, và so sánh với CPU fallback.
- [ ] Verify shader compile success trên ít nhất 1 Android target.
- [ ] Verify shader compile failure path + rescue behavior.
- [ ] Chốt GPU-to-CPU parity tolerance.
- [ ] Ghi lại evidence/runtime proof trước khi sang Phase 2.

## Phase 2: App Scaffold + Minimal Import Path

- [ ] Scaffold app shell thực tế từ harness đã validate.
- [ ] Tạo `LUTEngine` contract chung cho GPU + CPU path.
- [ ] Tạo `EditState` contract với undo/redo budget.
- [ ] Bổ sung parser + encoder tests sớm.
- [ ] Hỗ trợ import tối thiểu cho user LUT từ Phase 2.
- [ ] Verify imported LUT đi qua engine path đã validate.

## Phase 3: Vertical Editor Slice

- [ ] Ship flow tối thiểu:
  - pick image
  - import/apply LUT
  - adjust intensity
  - before/after
  - export

- [ ] Thiết kế editor theo quyết định đã approve:
  - LUT selection in-editor
  - dark-first UI
  - loading / error / empty states rõ ràng

- [ ] Áp dụng slider order đã chốt.
- [ ] Thêm rescue UX cho các critical gaps:
  - malformed LUT
  - invalid PNG / invalid HaldCLUT
  - shader compile failure
  - oversized input / OOM guard
  - export failure

## Phase 4a: Import-First Product Path

- [ ] Harden import `.cube` và `.png`.
- [ ] Thêm pre-decode size checks cho PNG.
- [ ] Thêm Android content URI sanitization.
- [ ] Hoàn thiện import-led flow sao cho vẫn có giá trị ngay cả khi chưa bundle full catalog.
- [ ] Localize core import/editor/settings sang `vi` + `en`.

## Phase 4b: Bundled Catalog + Monetization

- [ ] Chỉ bundle licensed presets sau khi licensing gate vẫn xanh.
- [ ] Pre-generate thumbnails trước khi mở rộng catalog.
- [ ] Implement RevenueCat entitlement bằng signed cache / SDK-backed state.
- [ ] Không dùng local boolean để unlock paid content.
- [ ] Test sandbox purchase + restore flows.
- [ ] Verify first-open catalog không freeze UI.

## Phase 5: Hardening + Release Prep

- [ ] Thêm crash reporting.
- [ ] Chuẩn bị staged rollout.
- [ ] Viết `docs/privacy-policy.md`.
- [ ] Chốt permission copy cho Android/iOS.
- [ ] Chạy perf/memory checks với ảnh `12MP+`.
- [ ] Chạy E2E cho flow pick -> edit -> export.
- [ ] Chốt Android-first release checklist.

## Test / Verification Gates

- [ ] Không bắt đầu execution nếu chưa có:
  - `docs/market-validation.md`
  - `docs/licensing.md`
  - `docs/brand.md`

- [ ] Không mở rộng UI/editor nếu chưa pass:
  - Phase 1a spec/core checks
  - Phase 1b runtime harness checks

- [ ] Không mở rộng catalog/paywall nếu chưa pass:
  - import hardening
  - entitlement correctness
  - thumbnail/perf strategy

- [ ] Không claim release-ready nếu chưa có evidence cho:
  - unit/integration/E2E
  - runtime proof
  - import hardening
  - purchase restore
  - 12MP preview/export perf

## Gợi ý thứ tự làm ngay

1. `docs/market-validation.md`
2. `docs/licensing.md`
3. `docs/brand.md`
4. `docs/lut-encoding-spec.md`
5. `docs/adr/0001-rendering-pipeline.md`
6. `docs/adr/0002-lut-asset-bundling.md`
7. Expo bare + Skia runtime harness
