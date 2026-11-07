# 课程数据与验收规则

## 数据字段

`learning_objectives` 使用稳定 `id`。`scenario.facts` 记录带 `id` 的事实。
`segments` 包含 `id`、`goal_ids`、`fact_ids`、`narration` 与 `interaction.kind`。当前样例使用 `comparison`、`dialogue-branch`、`timeline` 三种受控交互类型。
`assessment` 包含 `version`、`dimensions` 和 `questions`。维度 `weight` 为整数百分比且合计为100。题目包含 `options`、`correct_option`、`goal_ids`、`fact_ids` 和 `rationale`。

## 结构检查

运行 `python3 scripts/check_course.py assets/example.json`，核对标识唯一、对象关联、交互类型、答案选项、权重和事实引用。脚本只读取课程数据。

## 内容复核

目标应描述学员能做出的判断或行动。题目可用情景中的事实作答。错误选项的反馈说明具体判断依据。金额、服务能力及对外承诺应回到来源核查。

## 检查点与评分

分别保存目标、情景、教案、媒体及题目版本。上游内容更新后，重新生成依赖它的下游步骤。正式测验的答案、维度与评分版本在提交前固定。恢复任务保留已合格步骤与原始学习记录。

## 播放验收

逐段核对讲解与高亮时点，实际测试暂停、恢复、回看、跳转和音频失败提示。动画练习记录与正式测验记录分开展示。

本包采用通用业务名称与独立构造示例。公开内容仅展示方法、字段和校验过程，不包含真实组织、人员、客户、项目标识、内部地址、访问凭据或真实业务金额。
