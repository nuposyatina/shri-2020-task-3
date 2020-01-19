export enum RuleKeys {
    tooMuchMarketingBlocks = 'GRID_TOO_MUCH_MARKETING_BLOCKS',
    severalH1 = 'TEXT_SEVERAL_H1'
}

export interface RuleValues {
    'GRID.TOO_MUCH_MARKETING_BLOCKS': string;
    'TEXT.SEVERAL_H1' : string;
};

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
}

export type SeverityKey = keyof SeverityConfiguration;

export interface ExampleConfiguration {
 
    enable: boolean;
 
    severity: SeverityConfiguration;
}
