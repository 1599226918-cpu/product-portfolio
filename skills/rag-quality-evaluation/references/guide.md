# 评测字段与评分口径

## 输入约定

`documents` 包含文档 `id` 和 `sections`。章节包含 `id` 与 `text`。
`cases` 包含 `id`、`question` 和 `expected`。`expected.answer_mode` 为 `grounded`、`insufficient` 或 `conflict`，`evidence_sections` 使用 `文档ID/章节ID`。
`results` 包含 `case_id`、`answer`、`answer_mode` 和 `citations`。引用包含 `document_id`、`section_id` 与逐字 `quote`。

## 记录维度

| 维度 | 检查方法 | 判断依据 |
| --- | --- | --- |
| 检索覆盖 | 检查相关片段及排序 | 参考依据是否进入检索结果 |
| 引用完整性 | 自动结构校验与人工复核 | 章节存在、引文逐字匹配、应引用依据齐全 |
| 回答忠实度 | 人工语义复核 | 结论是否由证据支持，条件与限制是否遗漏 |
| 资料不足 | 自动模式检查与人工复核 | 缺少资料时是否保留不确定性 |
| 冲突与版本 | 人工业务判断 | 是否说明冲突，优先级是否有依据 |

## 校验脚本

在 Skill 目录运行 `python3 scripts/check_evidence.py assets/example.json`。脚本只读取传入文件，输出结构与引用问题，语义结论仍需复核。传入 `--output report.json` 时写出报告。

## 改进顺序

证据已检索到而答案错误时，先检查状态分类、引用绑定和条件遗漏。检索没有覆盖依据时，再检查切片、过滤、查询与重排。单次失败不足以证明需要更换模型。

本包采用通用业务名称与独立构造示例。公开内容仅展示方法、字段和校验过程，不包含真实组织、人员、客户、项目标识、内部地址、访问凭据或真实业务金额。
