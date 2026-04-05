import { Form, Input, Select } from 'antd';
import { AutomatorTarget, FormValues, SelectOption } from '../../types';

interface Props {
	options: SelectOption<AutomatorTarget>[];
}

export function AutomatorStep({ options }: Props) {
	return (
		<>
			<Form.Item<FormValues>
				label="בחירת יעד"
				name="AUTOMATION_TARGET"
				rules={[{ required: true, message: 'בחר יעד אוטומציה' }]}
			>
				<Select options={options} />
			</Form.Item>
			<Form.Item<FormValues>
				label="שם משתמש"
				name="AUTOMATOR_USERNAME"
				rules={[{ required: true, message: 'הכנס שם משתמש' }]}
			>
				<Input autoComplete="username" />
			</Form.Item>
			<Form.Item<FormValues>
				label="סיסמה"
				name="AUTOMATOR_PASSWORD"
				rules={[{ required: true, message: 'הכנס סיסמה' }]}
			>
				<Input.Password autoComplete="current-password" />
			</Form.Item>
		</>
	);
}
