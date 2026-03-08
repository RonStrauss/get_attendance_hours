import { Checkbox, Form, Space, Typography } from 'antd';
import { modifierLabels, modifierSupport } from '../../constants';
import { DayModifierKey, FormValues } from '../../types';

const { Text } = Typography;

export function ModifiersStep() {
	return (
		<>
			<Form.Item<FormValues> name="DAY_MODIFIERS">
				<Checkbox.Group>
					<Space wrap>
						{(Object.keys(modifierSupport) as DayModifierKey[]).map((modifier) => (
							<Checkbox key={modifier} value={modifier} disabled={!modifierSupport[modifier]}>
								{modifierLabels[modifier]}
								{!modifierSupport[modifier] ? ' (לא נתמך כרגע)' : ''}
							</Checkbox>
						))}
					</Space>
				</Checkbox.Group>
			</Form.Item>
			<Text type="secondary">קיצור מקלדת: Ctrl+Enter</Text>
		</>
	);
}
