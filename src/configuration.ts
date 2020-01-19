export enum RuleKeys {
    tooMuchMarketingBlocks = 'GRID_TOO_MUCH_MARKETING_BLOCKS',
    severalH1 = 'TEXT_SEVERAL_H1',
    invalidH2Position = 'TEXT_INVALID_H2_POSITION',
    invalidH3Position = 'TEXT_INVALID_H3_POSITION',
    invalidButtonPosition = 'WARNING_INVALID_BUTTON_POSITION',
    invalidButtonSize = 'WARNING_INVALID_BUTTON_SIZE',
    invalidPlaceholderSize = 'WARNING_INVALID_PLACEHOLDER_SIZE',
    textSizesShouldBeEqual = 'WARNING_TEXT_SIZES_SHOULD_BE_EQUAL',
    hasNoTextSize = 'WARNING_HAS_NOT_TEXT_SIZE'
}

export enum Severity {
    Error = "Error", 
    Warning = "Warning", 
    Information = "Information", 
    Hint = "Hint", 
    None = "None"
}


export interface SeverityConfiguration {
    [RuleKeys.severalH1]: Severity;
    [RuleKeys.tooMuchMarketingBlocks]: Severity;
    [RuleKeys.invalidH2Position]: Severity;
    [RuleKeys.invalidH3Position]: Severity;
    [RuleKeys.invalidButtonPosition]: Severity;
    [RuleKeys.invalidButtonSize]: Severity;
    [RuleKeys.invalidPlaceholderSize]: Severity;
    [RuleKeys.textSizesShouldBeEqual]: Severity;
    [RuleKeys.hasNoTextSize]: Severity;
}

export type SeverityKey = keyof SeverityConfiguration;

export interface ExampleConfiguration {
 
    enable: boolean;
 
    severity: SeverityConfiguration;
}
