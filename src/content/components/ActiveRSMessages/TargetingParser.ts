import mozjexl from "mozjexl";
import { ParsedTargetingExpression, Token } from "./TargetingParserTypes";

const TOKENS_WHITELIST = new Map([
  ["firefoxVersion", "version"],
  ["localeLanguageCode", "locale"],
  ["locale", "locale"],
]);

function parseTargetingExpression(expr: String): Array<Token> {
  return mozjexl._getLexer().tokenize(expr);
}

export function getTargetingAttributes(
  expr: String
): ParsedTargetingExpression {
  const tokens: Array<Token> = parseTargetingExpression(expr);
  const targetingTokens: ParsedTargetingExpression = {
    version: [],
    locale: [],
  };
  for (let i = 0; i < tokens.length; i++) {
    if (TOKENS_WHITELIST.has(tokens[i].value)) {
      let value = `${tokens[i].value} ${tokens[i + 1].value}`;
      switch (tokens[i + 2].type) {
        case "openBracket": {
          let j = i + 3;
          while (tokens[j].type !== "closeBracket" || j >= tokens.length) {
            value = `${value} ${tokens[j++].value}`;
          }
        }
        default:
          value = `${value} ${tokens[i + 2].value}`;
      }
      targetingTokens[TOKENS_WHITELIST.get(tokens[i].value)].push(value);
    }
  }

  return targetingTokens;
}
