# 内容与第三方来源

## 编辑规则

- 区分官方事实、编辑建议和用户经验；没有实地体验依据不使用“亲测”。
- 签证、费用、交通、预约和安全提醒保留来源、适用人群和查阅日期。
- 新专题检查索引、关联文章、章节 ID、表格列数、站点地图和搜索入口。
- 互斥路线不能拼成同一天；地图、交通段和住宿晚数应与所选方案一致。
- 图片只展示对应地点，示意照片不当作当天现场。
- 不复制小红书、抖音等平台作者的图文或视频；发布素材需自有或已获授权。

日本资料在 `apps/web/src/lib/japan-*.ts`，伊朗资料在 `iran-guide.ts` 与 `iran-guide-index.ts`。来源和日期随正文保存；不能只因航班或酒店可订就移除安全提醒。

## 数据与图片归属

| 内容 | 来源与许可 |
| --- | --- |
| 国家基础元数据 | [mledoze/countries](https://github.com/mledoze/countries)，MIT |
| 城市与首都坐标 | [World Cities / SimpleMaps](https://simplemaps.com/data/world-cities)，项目数据说明为 CC BY 4.0 |
| 地图 | [MapLibre GL JS](https://maplibre.org/)（BSD-3-Clause）、[OpenFreeMap](https://openfreemap.org/)、[OpenStreetMap](https://www.openstreetmap.org/copyright)；保持地图归属控件可见 |
| 城市与日本照片 | [Pexels](https://www.pexels.com/license/)；日本照片的摄影者和原始页面记录在 `japan-field-guide.ts` |

MapLibre Worker 的完整许可在构建时复制为 `/maplibre-gl-LICENSE.txt` 随站点分发；运行文件与 source map 从锁定依赖生成。第三方许可只覆盖对应素材，不代表此私有仓库整体开源。新增数据或图片需先核对许可并补充归属。
