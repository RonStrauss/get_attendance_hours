import { Checkbox, Form, Space, Typography } from 'antd';
import { DayModifierConfig, FormValues, dayModifierLabels } from '../../types';

const { Text } = Typography;

interface Props {
	modifiers: DayModifierConfig[];
}

export function ModifiersStep({ modifiers }: Props) {
	return (
		<>
			<Form.Item<FormValues> name="DAY_MODIFIERS">
				<Checkbox.Group>
					<Space wrap>
						{modifiers.map((modifier) => (
							<Checkbox key={modifier.key} value={modifier.key} disabled={!modifier.supported}>
								{dayModifierLabels[modifier.key]}
								{!modifier.supported ? ' (לא נתמך כרגע)' : ''}
							</Checkbox>
						))}
					</Space>
				</Checkbox.Group>
			</Form.Item>
			<Text type="secondary">קיצור מקלדת: Ctrl+Enter</Text>
		</>
	);
}
