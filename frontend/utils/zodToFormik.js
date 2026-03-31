export const zodToFormikValidate = (schema) => {
  return (values) => {
    const result = schema.safeParse(values);

    // If valid → no errors
    if (result.success) return {};

    const formErrors = {};

    // Safe access (prevents crash)
    const zodErrors = result.error?.issues || [];

    zodErrors.forEach((err) => {
      const field = err.path?.[0];
      if (field) {
        formErrors[field] = err.message;
      }
    });

    return formErrors;
  };
};