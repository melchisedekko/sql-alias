# README
## "sql-alias"

This Extension adds the command Search Query or Alias (sql-alias.searchQueryOrAlias)
you can define your own shortcuts to use this command in a fast and simple way.

the command will get the selected text or the text in your vs code clipboard if nothing is selected.
then it will try to understand if it is an Alias or a TableName using some regex.
(please note that only upper case string with lenght 3 to 7 are considered aliases)
and then run a query using the active connection information to get the corrisponding alias and schema
or the corresponding table and schema (in case of a selected Alias).
if a result is found in sys.synonims it will be automatically copied in your code clipboard.

**Enjoy!**
